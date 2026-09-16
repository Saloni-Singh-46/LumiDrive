"""Local HTTP inference bridge for the LumiDrive React dashboard."""

import argparse
import json
import os
import sys
import time
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import cv2
import numpy as np
import torch

PIPELINE_ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(PIPELINE_ROOT)
sys.path.insert(0, PIPELINE_ROOT)

from models.checkpoint_model import CheckpointRoadPerceptionNet


def mask_points(mask: np.ndarray, side: str, height: int, width: int) -> list[list[int]]:
    """Extract percentage-coordinate lane points from a binary mask."""
    points: list[list[int]] = []
    for y_percent in np.linspace(98, 50, 7):
        y = min(height - 1, max(0, int(y_percent / 100 * height)))
        row = np.flatnonzero(mask[y] > 0)
        if side == 'left':
            row = row[row < width * 0.5]
            x = row[-1] if row.size else width * 0.28
        else:
            row = row[row >= width * 0.5]
            x = row[0] if row.size else width * 0.72
        points.append([round(float(x) / width * 100), round(y_percent)])
    return points


def polygon_points(mask: np.ndarray, height: int, width: int) -> list[list[int]]:
    """Extract drivable corridor boundaries as percentage coordinates."""
    left: list[list[int]] = []
    right: list[list[int]] = []
    for y_percent in np.linspace(98, 50, 7):
        y = min(height - 1, max(0, int(y_percent / 100 * height)))
        row = np.flatnonzero(mask[y] > 0)
        if row.size:
            left.append([round(float(row[0]) / width * 100), round(y_percent)])
            right.append([round(float(row[-1]) / width * 100), round(y_percent)])
        else:
            left.append([28, round(y_percent)])
            right.append([72, round(y_percent)])
    return left + list(reversed(right))


def analyze_frame(model: torch.nn.Module, device: torch.device, image_bytes: bytes) -> dict[str, Any]:
    start = time.perf_counter()
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError('The uploaded file is not a readable image')

    height, width = frame.shape[:2]
    resized = cv2.resize(frame, (640, 360))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    tensor = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255).unsqueeze(0).unsqueeze(0)
    tensor = tensor.to(device)

    with torch.inference_mode():
        outputs = model(tensor)
        lane_probabilities = torch.softmax(outputs['lane_logits'][0], dim=0)
        drivable_probabilities = torch.softmax(outputs['drivable_logits'][0], dim=0)
        lane_mask = (torch.argmax(lane_probabilities, dim=0) == 1).cpu().numpy().astype(np.uint8)
        drivable_mask = (torch.argmax(drivable_probabilities, dim=0) > 0).cpu().numpy().astype(np.uint8)
        lane_confidence = float(lane_probabilities[1][lane_mask == 1].mean()) if lane_mask.any() else 0.0
        drivable_confidence = float(drivable_probabilities[1:].max(dim=0).values[drivable_mask == 1].mean()) if drivable_mask.any() else 0.0

    lane_points_left = mask_points(lane_mask, 'left', 360, 640)
    lane_points_right = mask_points(lane_mask, 'right', 360, 640)
    drivable_polygon = polygon_points(drivable_mask, 360, 640)
    bottom_lane = np.flatnonzero(lane_mask[-1] > 0)
    lane_center = float((bottom_lane[0] + bottom_lane[-1]) / 2) if bottom_lane.size >= 2 else 320.0
    offset_cm = round(((lane_center - 320) / 640) * 370, 1)
    latency_ms = round((time.perf_counter() - start) * 1000, 1)
    reliability = round(max(0.0, min(1.0, (lane_confidence + drivable_confidence) / 2)), 2)

    return {
        'lanes': [
            {'id': 'model-lane-left', 'type': 'left', 'points': lane_points_left, 'confidence': round(lane_confidence, 2), 'dashed': False},
            {'id': 'model-lane-right', 'type': 'right', 'points': lane_points_right, 'confidence': round(lane_confidence, 2), 'dashed': True},
        ],
        'drivablePolygon': drivable_polygon,
        'drivableIoU': round(float(drivable_mask.mean()), 2),
        'drivableCoverage': round(float(drivable_mask.mean()) * 100, 1),
        'drivableConfidence': round(drivable_confidence, 2),
        'vehicles': [],
        'weather': 'Model inference',
        'weatherConfidence': reliability,
        'visibility': 'Good' if reliability >= 0.7 else 'Moderate' if reliability >= 0.4 else 'Low',
        'roadType': 'Model-detected road scene',
        'timeOfDay': 'Not estimated by model',
        'temporalStability': reliability,
        'telemetry': {
            'laneCenterOffsetCm': offset_cm,
            'curvatureRadiusM': 2400,
            'curvatureDirection': 'Straight',
            'steeringRecommendation': 'Centered; model corridor available',
            'reliabilityScore': reliability,
            'reliabilityState': 'Reliable' if reliability >= 0.85 else 'Caution' if reliability >= 0.6 else 'Unreliable',
            'processingLatencyMs': latency_ms,
            'fps': round(1000 / max(latency_ms, 1), 1),
        },
        'analyzedImageWidth': width,
        'analyzedImageHeight': height,
    }


class InferenceHandler(BaseHTTPRequestHandler):
    model: torch.nn.Module
    device: torch.device

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:3000')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_json(204, {})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == '/health':
            self.send_json(200, {'status': 'ok', 'model': 'LumiDrive MultiTaskRoadPerceptionNet', 'device': str(self.device)})
        else:
            self.send_json(404, {'error': 'Not found'})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != '/analyze':
            self.send_json(404, {'error': 'Not found'})
            return
        try:
            content_type = self.headers.get('Content-Type', '')
            content_length = int(self.headers.get('Content-Length', '0'))
            body = self.rfile.read(content_length)
            message = BytesParser(policy=policy.default).parsebytes(
                f'Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n'.encode() + body
            )
            image_bytes = None
            for part in message.iter_parts():
                if part.get_param('name', header='Content-Disposition') == 'image':
                    image_bytes = part.get_payload(decode=True)
                    break
            if not image_bytes:
                raise ValueError('Expected multipart field named image')
            result = analyze_frame(self.model, self.device, image_bytes)
            self.send_json(200, result)
        except Exception as error:
            self.send_json(400, {'error': str(error)})

    def log_message(self, format: str, *args: object) -> None:
        print(f'[model-api] {format % args}')


def main() -> None:
    parser = argparse.ArgumentParser(description='LumiDrive local model API')
    parser.add_argument('--weights', default=os.path.join(PROJECT_ROOT, 'research_graphs_colab', 'lumidrive_best_model.pth'))
    parser.add_argument('--device', default='cuda' if torch.cuda.is_available() else 'cpu')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    device = torch.device(args.device)
    model = CheckpointRoadPerceptionNet(use_temporal=True)
    if not os.path.exists(args.weights):
        raise FileNotFoundError(f'Checkpoint not found: {args.weights}')
    model.load_state_dict(torch.load(args.weights, map_location=device))
    model.to(device).eval()
    InferenceHandler.model = model
    InferenceHandler.device = device
    print(f'LumiDrive model API listening at http://{args.host}:{args.port}')
    print(f'Loaded checkpoint: {args.weights}')
    ThreadingHTTPServer((args.host, args.port), InferenceHandler).serve_forever()


if __name__ == '__main__':
    main()