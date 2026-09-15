"""
Temporal Sequence Dataset Loader with Adverse Weather Synthesizer.
Supports multi-frame sliding window extraction (T=4) and realistic weather degradation:
- Rain Streaks & Water Splash
- Atmospheric Fog / Scattering
- Night Sensor Blooming & Headlight Glare
- Faded Marking Degradation
"""

import random
import numpy as np
import torch
from torch.utils.data import Dataset
import cv2

class AdverseWeatherAugmentor:
    """Simulates realistic dynamic weather perturbations."""
    @staticmethod
    def add_rain_streaks(img: np.ndarray, intensity: float = 0.6, rng: random.Random = None) -> np.ndarray:
        rng = rng or random
        h, w, _ = img.shape
        num_drops = int(intensity * 600)
        slant = rng.randint(-8, 8)
        drop_length = rng.randint(15, 30)

        rain_layer = np.zeros((h, w), dtype=np.uint8)
        for _ in range(num_drops):
            x = rng.randint(0, w - 1)
            y = rng.randint(0, h - 1)
            cv2.line(rain_layer, (x, y), (x + slant, y + drop_length), 255, 1)

        rain_layer = cv2.blur(rain_layer, (3, 3))
        rain_3ch = cv2.cvtColor(rain_layer, cv2.COLOR_GRAY2BGR)
        
        # Alpha blend rain streaks
        result = cv2.addWeighted(img, 1.0, rain_3ch, 0.4 * intensity, 0)
        return result

    @staticmethod
    def add_fog_scattering(img: np.ndarray, beta: float = 0.03) -> np.ndarray:
        """Koschmieder atmospheric scattering model: I(x) = J(x)e^(-beta*d) + A(1 - e^(-beta*d))"""
        h, w, _ = img.shape
        # Create synthetic depth map (horizon to bonnet)
        depth = np.linspace(1.0, 0.05, h).reshape(h, 1)
        depth = np.repeat(depth, w, axis=1)
        
        transmission = np.exp(-beta * depth * 50)
        transmission = np.expand_dims(transmission, axis=-1)
        
        airlight = np.array([220, 225, 230], dtype=np.float32)
        img_float = img.astype(np.float32)
        foggy = img_float * transmission + airlight * (1.0 - transmission)
        return np.clip(foggy, 0, 255).astype(np.uint8)

    @staticmethod
    def add_headlight_glare(img: np.ndarray, center=(320, 180), radius=120) -> np.ndarray:
        h, w, _ = img.shape
        y, x = np.ogrid[:h, :w]
        dist_sq = (x - center[0])**2 + (y - center[1])**2
        mask = np.exp(-dist_sq / (2.0 * (radius / 2.5)**2))
        mask = np.expand_dims(mask, axis=-1)
        
        glare_color = np.array([255, 250, 235], dtype=np.float32)
        blended = img.astype(np.float32) + glare_color * mask * 0.8
        return np.clip(blended, 0, 255).astype(np.uint8)

class RoadPerceptionSequenceDataset(Dataset):
    """
    Temporal multi-frame road perception dataset.
    Returns:
    - sequence_frames: [T, 3, H, W]
    - lane_target: [H, W] (0 = background, 1 = lane)
    - drivable_target: [H, W] (0 = background, 1 = direct drivable, 2 = alternate)
    - weather_label: string
    """
    def __init__(self, num_samples: int = 200, seq_len: int = 4, 
                 img_size=(360, 640), augment_weather: bool = True, sample_offset: int = 0):
        self.num_samples = num_samples
        self.seq_len = seq_len
        self.img_size = img_size # (H, W)
        self.augment_weather = augment_weather
        self.sample_offset = sample_offset
        self.augmentor = AdverseWeatherAugmentor()

    def __len__(self) -> int:
        return self.num_samples

    def _generate_synthetic_road_frame(self, t_offset: float = 0.0, weather_type: str = 'clear', rng: random.Random = None):
        h, w = self.img_size
        img = np.zeros((h, w, 3), dtype=np.uint8)

        # Sky and road gradient
        horizon = int(h * 0.48)
        img[:horizon] = [135, 110, 80] # Sky
        img[horizon:] = [40, 40, 42]   # Asphalt

        # Lane geometries
        lane_mask = np.zeros((h, w), dtype=np.uint8)
        drivable_mask = np.zeros((h, w), dtype=np.uint8)

        # Left lane curve
        left_pts = []
        right_pts = []
        for y in range(horizon, h, 5):
            ratio = (y - horizon) / (h - horizon)
            lx = int(w * 0.5 - ratio * (w * 0.32) + np.sin(t_offset) * 10)
            rx = int(w * 0.5 + ratio * (w * 0.32) + np.sin(t_offset) * 10)
            left_pts.append((lx, y))
            right_pts.append((rx, y))

        # Label background, ego lane, and an adjacent lane separately.
        poly_pts = np.array(left_pts + right_pts[::-1], dtype=np.int32)
        cv2.fillPoly(drivable_mask, [poly_pts], 1)
        alternate_right_pts = [(min(w - 1, int(x + w * 0.18)), y) for x, y in right_pts]
        alternate_poly = np.array(right_pts + alternate_right_pts[::-1], dtype=np.int32)
        cv2.fillPoly(drivable_mask, [alternate_poly], 2)

        # Draw lane markings
        for i in range(len(left_pts) - 1):
            cv2.line(img, left_pts[i], left_pts[i+1], (230, 230, 230), 4)
            cv2.line(lane_mask, left_pts[i], left_pts[i+1], 1, 4)
            
            # Dashed right line
            if i % 3 != 0:
                cv2.line(img, right_pts[i], right_pts[i+1], (240, 240, 240), 4)
                cv2.line(lane_mask, right_pts[i], right_pts[i+1], 1, 4)

        # Apply synthetic adverse weather
        if weather_type == 'rain':
            img = self.augmentor.add_rain_streaks(img, intensity=0.8, rng=rng)
        elif weather_type == 'fog':
            img = self.augmentor.add_fog_scattering(img, beta=0.035)
        elif weather_type == 'night_glare':
            img = (img * 0.3).astype(np.uint8)
            img = self.augmentor.add_headlight_glare(img, center=(int(w*0.4), horizon + 20), radius=90)

        return img, lane_mask, drivable_mask

    def __getitem__(self, idx: int):
        sample_idx = idx + self.sample_offset
        weather_types = ['clear', 'rain', 'fog', 'night_glare', 'transition']
        rng = random.Random(sample_idx)
        weather = weather_types[sample_idx % len(weather_types)]

        frames = []
        final_lane = None
        final_drivable = None

        for t in range(self.seq_len):
            t_offset = (sample_idx + t * 0.2) * 0.1
            sub_weather = weather
            if weather == 'transition':
                sub_weather = 'clear' if t < self.seq_len // 2 else 'rain'

            if not self.augment_weather and sub_weather != 'clear':
                sub_weather = 'clear'
            img, lane_m, driv_m = self._generate_synthetic_road_frame(t_offset, sub_weather, rng=rng)
            
            # Convert to PyTorch Tensor [3, H, W] normalized
            img_t = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
            frames.append(img_t)

            if t == self.seq_len - 1:
                final_lane = torch.from_numpy(lane_m).long()
                final_drivable = torch.from_numpy(driv_m).long()

        seq_tensor = torch.stack(frames, dim=0) # [T, 3, H, W]

        return {
            'images': seq_tensor,
            'lane_masks': final_lane,
            'drivable_masks': final_drivable,
            'weather': weather
        }
