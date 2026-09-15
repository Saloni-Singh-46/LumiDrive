"""Composition utilities for source-aware multi-dataset training."""

from typing import Iterable, List

import torch
from torch.utils.data import ConcatDataset, Dataset


class MixedRoadDataset(ConcatDataset):
    """Concatenate datasets while preserving a consistent training contract."""

    def __init__(self, datasets: Iterable[Dataset]) -> None:
        datasets = list(datasets)
        if not datasets:
            raise ValueError("At least one dataset must be configured")
        super().__init__(datasets)


def collate_source_flags(batch: List[dict]) -> dict:
    """Default collation plus boolean masks for task-specific supervision."""
    from torch.utils.data._utils.collate import default_collate

    result = default_collate(batch)
    result["lane_valid"] = torch.tensor([item.get("lane_valid", True) for item in batch], dtype=torch.bool)
    result["drivable_valid"] = torch.tensor(
        [item.get("drivable_valid", True) for item in batch], dtype=torch.bool
    )
    return result