"""Validate an official CULane download and print usable split statistics."""

import argparse
from pathlib import Path

from culane_dataset import CULaneSequenceDataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a local CULane dataset")
    parser.add_argument("--data-root", required=True, help="Directory containing CULane images, masks, and list/")
    parser.add_argument("--seq-len", type=int, default=4)
    args = parser.parse_args()

    root = Path(args.data_root)
    if not (root / "list").exists():
        raise FileNotFoundError(f"Missing {root / 'list'}; extract the official CULane list archive first.")

    for split in ("train", "val"):
        dataset = CULaneSequenceDataset(str(root), split=split, seq_len=args.seq_len)
        print(f"{split}: {len(dataset)} contiguous windows")

    print("CULane lane labels: genuine")
    print("Drivable labels: geometric proxy only; do not use for genuine drivable-area claims")


if __name__ == "__main__":
    main()
