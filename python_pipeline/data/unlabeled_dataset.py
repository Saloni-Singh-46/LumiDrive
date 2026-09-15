"""Image-only adapter for domain-shift sources without compatible segmentation labels."""

from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np
import torch
from torch.utils.data import Dataset


class UnlabeledImageSequenceDataset(Dataset):
    """Load images from SHIFT or a shared Drive folder without inventing labels."""

    def __init__(self, root: str, seq_len: int = 4, img_size: Tuple[int, int] = (360, 640), max_samples: int | None = None):
        self.root = Path(root)
        self.seq_len = seq_len
        self.img_size = img_size
        self.images: List[Path] = sorted(
            path for path in self.root.rglob("*") if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )
        if max_samples:
            self.images = self.images[:max_samples]
        if not self.images:
            raise FileNotFoundError(f"No images found below {self.root}")

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, index: int) -> Dict[str, object]:
        image = cv2.imread(str(self.images[index]), cv2.IMREAD_COLOR)
        if image is None:
            raise FileNotFoundError(f"Unable to read image: {self.images[index]}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (self.img_size[1], self.img_size[0]), interpolation=cv2.INTER_LINEAR)
        frame = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
        return {
            "images": frame.unsqueeze(0).repeat(self.seq_len, 1, 1, 1),
            "lane_masks": torch.zeros(self.img_size, dtype=torch.long),
            "drivable_masks": torch.zeros(self.img_size, dtype=torch.long),
            "weather": "unlabeled",
            "dataset_source": self.root.name,
            "lane_valid": False,
            "drivable_valid": False,
        }