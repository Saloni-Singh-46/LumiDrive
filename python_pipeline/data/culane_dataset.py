"""
CULane sequence dataset adapter.

Expected CULane layout after downloading the official academic archives:
    culane_root/
      driver_23_30frame/...
      laneseg_label_w16/...
      list/train_gt.txt

Each train_gt.txt row is:
    image_path mask_path lane_exists_0 lane_exists_1 lane_exists_2 lane_exists_3

CULane supplies genuine lane segmentation labels, but not drivable-area labels.
The drivable target returned here is therefore a documented geometric proxy and
must not be reported as a genuine drivable-area benchmark.
"""

from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np
import torch
from torch.utils.data import Dataset


class CULaneSequenceDataset(Dataset):
    """Load contiguous CULane frames and lane masks for real lane training."""

    def __init__(
        self,
        root: str,
        split: str = "train",
        seq_len: int = 4,
        img_size: Tuple[int, int] = (360, 640),
        list_file: str | None = None,
    ) -> None:
        self.root = Path(root)
        self.seq_len = seq_len
        self.img_size = img_size
        list_path = Path(list_file) if list_file else self.root / "list" / f"{split}_gt.txt"
        if not list_path.exists():
            raise FileNotFoundError(
                f"CULane split list not found: {list_path}. "
                "Download the official list archive and pass --data-root."
            )

        self.records = self._read_records(list_path)
        self.windows = self._build_windows()
        if not self.windows:
            raise RuntimeError(f"No contiguous CULane windows found in {list_path}")

    def _read_records(self, list_path: Path) -> List[Tuple[Path, Path]]:
        records: List[Tuple[Path, Path]] = []
        for raw_line in list_path.read_text(encoding="utf-8").splitlines():
            fields = raw_line.strip().split()
            if len(fields) < 2:
                continue
            image_path = self.root / fields[0]
            mask_path = self.root / fields[1]
            if image_path.exists() and mask_path.exists():
                records.append((image_path, mask_path))
        return records

    def _build_windows(self) -> List[List[Tuple[Path, Path]]]:
        grouped: Dict[Path, List[Tuple[Path, Path]]] = {}
        for record in self.records:
            grouped.setdefault(record[0].parent, []).append(record)

        windows: List[List[Tuple[Path, Path]]] = []
        for sequence in grouped.values():
            sequence.sort(key=lambda item: item[0].name)
            for start in range(0, max(0, len(sequence) - self.seq_len + 1)):
                windows.append(sequence[start : start + self.seq_len])
        return windows

    def __len__(self) -> int:
        return len(self.windows)

    def _load_frame(self, image_path: Path) -> torch.Tensor:
        image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        if image is None:
            raise FileNotFoundError(f"Unable to read CULane image: {image_path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (self.img_size[1], self.img_size[0]), interpolation=cv2.INTER_LINEAR)
        return torch.from_numpy(image).permute(2, 0, 1).float() / 255.0

    def _load_lane_mask(self, mask_path: Path) -> torch.Tensor:
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if mask is None:
            raise FileNotFoundError(f"Unable to read CULane mask: {mask_path}")
        mask = cv2.resize(mask, (self.img_size[1], self.img_size[0]), interpolation=cv2.INTER_NEAREST)
        return torch.from_numpy((mask > 0).astype(np.int64))

    def _proxy_drivable_mask(self, lane_mask: torch.Tensor) -> torch.Tensor:
        """Create a clearly-labeled geometric proxy, not a ground-truth drivable mask."""
        mask = lane_mask.numpy().astype(np.uint8)
        height, _ = mask.shape
        _, xs = np.where(mask > 0)
        result = np.zeros_like(mask, dtype=np.int64)
        if len(xs) < 2:
            return torch.from_numpy(result)
        left, right = int(xs.min()), int(xs.max())
        horizon = int(height * 0.45)
        result[horizon:, left:right + 1] = 1
        return torch.from_numpy(result)

    def __getitem__(self, index: int) -> Dict[str, object]:
        window = self.windows[index]
        images = torch.stack([self._load_frame(image_path) for image_path, _ in window])
        lane_mask = self._load_lane_mask(window[-1][1])
        return {
            "images": images,
            "lane_masks": lane_mask,
            "drivable_masks": self._proxy_drivable_mask(lane_mask),
            "weather": "real_culane",
            "drivable_is_proxy": True,
            "lane_valid": True,
            "drivable_valid": False,
            "dataset_source": "culane",
        }
