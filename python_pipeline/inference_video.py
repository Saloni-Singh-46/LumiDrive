"""
Standalone Video Inference Pipeline with ADAS HUD Telemetry Overlay.
Processes an input driving video (.mp4/.avi/.mov) and outputs:
1. Processed video with multi-task visual perception overlays and ADAS telemetry HUD
2. Frame-by-frame telemetry log (.csv)
"""

import os
import argparse
import time
import cv2
import numpy as np
import torch
import pandas as pd
from collections import deque
from models.multitask_network import MultiTaskRoadPerceptionNet

def process_video(
    input_path: str, 
    output_path: str, 
    weights_path: str = None, 
    seq_len: int = 4, 
    device: str = 'cpu',
    save_csv: bool = True
):
    print(f"Loading input video from: {input_path}")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Cannot open input video file: {input_path}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Video metadata: {width}x{height} @ {fps:.1f} FPS, Total frames: {total_frames}")

    # Video Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Initialize model
    model = MultiTaskRoadPerceptionNet(use_temporal=True)
    if weights_path and os.path.exists(weights_path):
        print(f"Loading checkpoint weights from: {weights_path}")
        model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()

    # Temporal sliding frame buffer
    frame_buffer = deque(maxlen=seq_len)
    telemetry_records = []
    frame_idx = 0

    print("Processing video frames...")
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        start_t = time.time()

        # Preprocessing: resize to 640x360 for model input
        input_h, input_w = 360, 640
        resized = cv2.resize(frame, (input_w, input_h))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        tensor_frame = torch.from_numpy(rgb).permute(2, 0, 1).float() / 255.0

        # Fill sliding buffer
        if len(frame_buffer) == 0:
            for _ in range(seq_len):
                frame_buffer.append(tensor_frame)
        else:
            frame_buffer.append(tensor_frame)

        # Batch sequence: [1, T, 3, H, W]
        seq_tensor = torch.stack(list(frame_buffer), dim=0).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(seq_tensor)

        infer_time = (time.time() - start_t) * 1000 # ms
        current_fps = 1000.0 / max(infer_time, 1.0)

        # Post-processing masks
        lane_logits = outputs['lane_logits'][0] # [2, H, W]
        drivable_logits = outputs['drivable_logits'][0] # [3, H, W]

        lane_mask = (torch.argmax(lane_logits, dim=0) == 1).cpu().numpy().astype(np.uint8)
        drivable_mask = (torch.argmax(drivable_logits, dim=0) > 0).cpu().numpy().astype(np.uint8)

        # Upscale masks to original frame size
        lane_mask_full = cv2.resize(lane_mask, (width, height), interpolation=cv2.INTER_NEAREST)
        drivable_mask_full = cv2.resize(drivable_mask, (width, height), interpolation=cv2.INTER_NEAREST)

        # 1. Overlay Drivable Area (Emerald green blend)
        drivable_overlay = np.zeros_like(frame)
        drivable_overlay[drivable_mask_full == 1] = [50, 205, 50] # BGR Green
        frame = cv2.addWeighted(frame, 1.0, drivable_overlay, 0.35, 0)

        # 2. Overlay Lane Markings (Cyan glow)
        frame[lane_mask_full == 1] = [255, 230, 0] # BGR Cyan/Yellow

        # 3. Compute ADAS telemetry (lateral offset estimation)
        bottom_y = int(height * 0.9)
        lane_indices = np.where(lane_mask_full[bottom_y, :] == 1)[0]
        if len(lane_indices) >= 2:
            left_x = lane_indices[0]
            right_x = lane_indices[-1]
            lane_center_x = (left_x + right_x) / 2.0
            image_center_x = width / 2.0
            offset_px = lane_center_x - image_center_x
            offset_cm = (offset_px / width) * 370.0 # ~3.7m standard lane width in cm
        else:
            offset_cm = 0.0

        # Draw ADAS HUD on Top Left
        hud_bg = frame[20:140, 20:320].copy()
        cv2.rectangle(frame, (20, 20), (320, 140), (15, 23, 42), -1) # Dark slate
        frame[20:140, 20:320] = cv2.addWeighted(hud_bg, 0.2, frame[20:140, 20:320], 0.8, 0)
        cv2.rectangle(frame, (20, 20), (320, 140), (0, 200, 255), 1)

        cv2.putText(frame, "LUMIDRIVE ADAS TELEMETRY", (35, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, f"Offset: {offset_cm:+.1f} cm", (35, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, f"FPS: {current_fps:.1f} ({infer_time:.1f} ms)", (35, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 255, 100), 1, cv2.LINE_AA)
        cv2.putText(frame, "Model: ConvGRU + CTC Loss", (35, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)

        out.write(frame)

        telemetry_records.append({
            'frame': frame_idx,
            'offset_cm': offset_cm,
            'fps': current_fps,
            'latency_ms': infer_time
        })

        if frame_idx % 30 == 0:
            print(f"Processed frame {frame_idx}/{total_frames} ({current_fps:.1f} FPS)")

    cap.release()
    out.release()
    print(f"Successfully exported processed video to: {output_path}")

    if save_csv and telemetry_records:
        csv_path = output_path.replace('.mp4', '_telemetry.csv')
        df = pd.DataFrame(telemetry_records)
        df.to_csv(csv_path, index=False)
        print(f"Successfully exported telemetry log to: {csv_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="LumiDrive Video Inference")
    parser.add_argument('--input', type=str, required=True, help="Path to input video file")
    parser.add_argument('--output', type=str, default="output_perception.mp4", help="Path to output video file")
    parser.add_argument('--weights', type=str, default=None, help="Path to trained model weights (.pth)")
    parser.add_argument('--device', type=str, default='cpu', help="Compute device ('cpu' or 'cuda')")
    args = parser.parse_args()

    process_video(args.input, args.output, weights_path=args.weights, device=args.device)
