"""
BDD100K Multi-Task Dataset and Sequence Adapter.

Supports both official BDD100K distributions and Kaggle packages:
- solesensei/solesensei_bdd100k
- marquis03/bdd100k

Extracts:
1. Multi-frame temporal windows [T, 3, H, W]
2. Lane Line Segmentation masks [H, W] (Class 0: Background, Class 1: Lane Marking)
3. Drivable Area Segmentation masks [H, W] (Class 0: Background, Class 1: Main Drivable, Class 2: Alternative Drivable)
4. Environmental condition tags (rainy, snowy, foggy, night, overcast, clear)
"""

import os
import json
import random
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import torch
from torch.utils.data import Dataset


class BDD100KSequenceDataset(Dataset):
    """
    BDD100K Dataset Adapter for LumiDrive Spatiotemporal Multi-Task Perception.
    """

    def __init__(
        self,
        root: Union[str, Path],
        split: str = "train",
        seq_len: int = 4,
        img_size: Tuple[int, int] = (360, 640),
        weather_filter: Optional[str] = None,
        max_samples: Optional[int] = None,
        augment: bool = True,
    ) -> None:
        super().__init__()
        self.root = Path(root)
        self.split = split
        self.seq_len = seq_len
        self.img_size = img_size  # (H, W)
        self.weather_filter = weather_filter
        self.max_samples = max_samples
        self.augment = augment and (split == "train")

        self.samples: List[Dict] = []
        self._discover_dataset_structure()

        if len(self.samples) == 0:
            # Fallback: scan for image-mask pairs directly
            self._scan_filesystem_pairs()

        if self.max_samples and len(self.samples) > self.max_samples:
            self.samples = self.samples[:self.max_samples]

        print(f"[BDD100K] Initialized {split} dataset with {len(self.samples)} samples (seq_len={seq_len}).")

    def _discover_dataset_structure(self) -> None:
        """Locates images, drivable masks, lane masks, and metadata JSON files across various formats."""
        # 1. Search for JSON annotations (official or Kaggle formats)
        possible_json_paths = [
            self.root / f"bdd100k_labels_images_{self.split}.json",
            self.root / "labels" / f"bdd100k_labels_images_{self.split}.json",
            self.root / "bdd100k" / "labels" / f"bdd100k_labels_images_{self.split}.json",
            self.root / "labels" / "lane" / f"{self.split}.json",
        ]

        metadata_lookup = {}
        for p in possible_json_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    for item in data:
                        img_name = item.get("name", "")
                        base_key = Path(img_name).stem
                        attrs = item.get("attributes", {})
                        metadata_lookup[base_key] = {
                            "weather": attrs.get("weather", "clear"),
                            "timeofday": attrs.get("timeofday", "daytime"),
                            "scene": attrs.get("scene", "highway"),
                        }
                except Exception as e:
                    print(f"[BDD100K] Warning reading {p}: {e}")
                break

        # 2. Locate image folder
        image_dirs = [
            self.root / "images" / "100k" / self.split,
            self.root / "images" / "10k" / self.split,
            self.root / "images" / self.split,
            self.root / "bdd100k" / "images" / "100k" / self.split,
            self.root / "bdd100k_images_100k" / "images" / self.split,
            self.root / "100k" / self.split,
            self.root / self.split,
        ]

        img_dir = None
        for d in image_dirs:
            if d.exists() and d.is_dir():
                img_dir = d
                break

        if img_dir is None:
            return

        # 3. Locate drivable masks folder
        drivable_dirs = [
            self.root / "drivable_maps" / "labels" / self.split,
            self.root / "labels" / "drivable" / "masks" / self.split,
            self.root / "labels" / "drivable" / self.split,
            self.root / "drivable_masks" / self.split,
            self.root / "bdd100k" / "labels" / "drivable" / "masks" / self.split,
        ]
        drivable_dir = None
        for d in drivable_dirs:
            if d.exists() and d.is_dir():
                drivable_dir = d
                break

        # 4. Locate lane masks folder
        lane_dirs = [
            self.root / "lane_masks" / "labels" / self.split,
            self.root / "labels" / "lane" / "masks" / self.split,
            self.root / "labels" / "lane" / self.split,
            self.root / "lane_masks" / self.split,
            self.root / "bdd100k" / "labels" / "lane" / "masks" / self.split,
        ]
        lane_dir = None
        for d in lane_dirs:
            if d.exists() and d.is_dir():
                lane_dir = d
                break

        # Scan image files
        valid_exts = {".jpg", ".jpeg", ".png"}
        for img_path in sorted(img_dir.glob("*.*")):
            if img_path.suffix.lower() not in valid_exts:
                continue

            stem = img_path.stem
            meta = metadata_lookup.get(stem, {"weather": "clear", "timeofday": "daytime", "scene": "highway"})

            if self.weather_filter and meta["weather"].lower() != self.weather_filter.lower():
                continue

            drivable_path = None
            if drivable_dir:
                for ext in [".png", ".jpg"]:
                    cand = drivable_dir / f"{stem}{ext}"
                    if cand.exists():
                        drivable_path = cand
                        break

            lane_path = None
            if lane_dir:
                for ext in [".png", ".jpg"]:
                    cand = lane_dir / f"{stem}{ext}"
                    if cand.exists():
                        lane_path = cand
                        break

            self.samples.append({
                "image_path": str(img_path),
                "drivable_path": str(drivable_path) if drivable_path else None,
                "lane_path": str(lane_path) if lane_path else None,
                "weather": meta["weather"],
                "timeofday": meta["timeofday"],
                "stem": stem,
            })

    def _scan_filesystem_pairs(self) -> None:
        """Emergency recursive scanner for image, drivable, and lane pairs."""
        all_imgs = sorted(list(self.root.rglob("*.jpg")) + list(self.root.rglob("*.png")))
        for p in all_imgs:
            if "mask" in p.name.lower() or "label" in p.parent.name.lower():
                continue
            self.samples.append({
                "image_path": str(p),
                "drivable_path": None,
                "lane_path": None,
                "weather": "clear",
                "timeofday": "daytime",
                "stem": p.stem,
            })

    def __len__(self) -> int:
        return len(self.samples)

    def _load_and_preprocess_image(self, path: str) -> np.ndarray:
        img = cv2.imread(path)
        if img is None:
            # Fallback blank frame if read fails
            img = np.zeros((self.img_size[0], self.img_size[1], 3), dtype=np.uint8)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (self.img_size[1], self.img_size[0]), interpolation=cv2.INTER_LINEAR)
        return img

    def _load_drivable_mask(self, path: Optional[str]) -> np.ndarray:
        h, w = self.img_size
        if not path or not os.path.exists(path):
            return np.zeros((h, w), dtype=np.int64)

        mask = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if mask is None:
            return np.zeros((h, w), dtype=np.int64)

        mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
        if mask.ndim == 3:
            # Convert color mask to class indices if needed (BDD100K: Red=Main, Blue=Alt)
            # In standard BDD100K grayscale masks: 0 = BG, 1 = Direct/Main Drivable, 2 = Alternative
            gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
            out = np.zeros((h, w), dtype=np.int64)
            out[gray == 1] = 1
            out[gray == 2] = 2
            out[(gray > 2) & (gray < 200)] = 1
            return out

        out = np.zeros((h, w), dtype=np.int64)
        out[mask == 1] = 1
        out[mask == 2] = 2
        out[mask > 2] = 1
        return out

    def _load_lane_mask(self, path: Optional[str], drivable_mask: np.ndarray) -> np.ndarray:
        h, w = self.img_size
        if not path or not os.path.exists(path):
            # If no explicit lane mask exists, extract lane boundaries from drivable perimeter
            lane_mask = np.zeros((h, w), dtype=np.int64)
            driv_binary = (drivable_mask > 0).astype(np.uint8)
            if driv_binary.sum() > 0:
                edges = cv2.Canny(driv_binary * 255, 50, 150)
                lane_mask[edges > 0] = 1
            return lane_mask

        mask = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if mask is None:
            return np.zeros((h, w), dtype=np.int64)

        mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
        lane_mask = np.zeros((h, w), dtype=np.int64)
        lane_mask[mask > 0] = 1
        return lane_mask

    def _generate_temporal_sequence(self, target_img: np.ndarray) -> np.ndarray:
        """
        Creates a temporal sequence [T, H, W, 3] leading to the target frame.
        Applies subtle ego-motion affine warp for past frames to model temporal vehicle dynamics.
        """
        h, w, c = target_img.shape
        frames = []
        
        # We synthesize small progressive ego-forward motion for T frames: t-3, t-2, t-1, t
        for idx in range(self.seq_len):
            offset_step = (self.seq_len - 1 - idx)
            if offset_step == 0:
                frames.append(target_img.copy())
            else:
                scale = 1.0 - (0.015 * offset_step)
                M = cv2.getRotationMatrix2D((w / 2, h / 2), 0, scale)
                M[1, 2] += (2.0 * offset_step)  # slight downward pitch
                warped = cv2.warpAffine(target_img, M, (w, h), borderMode=cv2.BORDER_REFLECT)
                frames.append(warped)

        return np.stack(frames, axis=0)  # [T, H, W, 3]

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        sample = self.samples[idx]
        target_img = self._load_and_preprocess_image(sample["image_path"])
        drivable_mask = self._load_drivable_mask(sample["drivable_path"])
        lane_mask = self._load_lane_mask(sample["lane_path"], drivable_mask)

        # Build temporal sequence [T, H, W, 3]
        seq_images_np = self._generate_temporal_sequence(target_img)

        # Convert to Tensor [T, 3, H, W] normalized to [0, 1]
        seq_tensor = torch.from_numpy(seq_images_np).float().permute(0, 3, 1, 2) / 255.0
        lane_tensor = torch.from_numpy(lane_mask).long()
        drivable_tensor = torch.from_numpy(drivable_mask).long()

        return {
            "images": seq_tensor,              # [T, 3, H, W]
            "lane_masks": lane_tensor,          # [H, W]
            "drivable_masks": drivable_tensor,  # [H, W]
            "weather": sample.get("weather", "clear"),
            "timeofday": sample.get("timeofday", "daytime"),
            "dataset_source": "bdd100k",
            "lane_valid": sample["lane_path"] is not None,
            "drivable_valid": sample["drivable_path"] is not None,
        }
