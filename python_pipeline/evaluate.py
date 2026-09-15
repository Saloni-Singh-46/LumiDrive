"""
Evaluation & Quantitative Benchmarking Suite.
Computes:
- Lane F1 & IoU
- Drivable Area mIoU
- Cross-Task Inconsistency Ratio (CTIR)
- Temporal Prediction Flicker Index (TPFI)
Across Clear, Steady Adverse, and Dynamic Transition splits.
"""

import torch
import numpy as np
import argparse
from typing import Dict
from models.multitask_network import MultiTaskRoadPerceptionNet
from data.dataset import RoadPerceptionSequenceDataset
from data.culane_dataset import CULaneSequenceDataset
from data.bdd100k_dataset import BDD100KSequenceDataset
from data.unlabeled_dataset import UnlabeledImageSequenceDataset
from data.mixed_dataset import MixedRoadDataset, collate_source_flags
from torch.utils.data import DataLoader

def compute_iou(pred_mask: torch.Tensor, target_mask: torch.Tensor, num_classes: int) -> list:
    ious = []
    pred = pred_mask.view(-1)
    target = target_mask.view(-1)
    for c in range(num_classes):
        pred_inds = (pred == c)
        target_inds = (target == c)
        intersection = (pred_inds & target_inds).sum().float().item()
        union = (pred_inds | target_inds).sum().float().item()
        if union != 0:
            ious.append(intersection / union)
    return ious

def compute_ctir(lane_pred: torch.Tensor, drivable_pred: torch.Tensor) -> float:
    """
    Cross-Task Inconsistency Ratio:
    Ratio of predicted lane pixels that lie completely outside the predicted drivable region.
    """
    lane_pixels = (lane_pred == 1)
    drivable_pixels = (drivable_pred > 0)
    
    total_lane = lane_pixels.sum().float().item()
    if total_lane == 0:
        return float('nan')
    
    inconsistent_pixels = (lane_pixels & (~drivable_pixels)).sum().float().item()
    return (inconsistent_pixels / total_lane) * 100.0

def compute_f1(pred_mask: torch.Tensor, target_mask: torch.Tensor, foreground: int = 1) -> float:
    pred = pred_mask == foreground
    target = target_mask == foreground
    true_positive = (pred & target).sum().float().item()
    false_positive = (pred & ~target).sum().float().item()
    false_negative = (~pred & target).sum().float().item()
    denominator = 2 * true_positive + false_positive + false_negative
    return 0.0 if denominator == 0 else (2 * true_positive) / denominator

def compute_flicker(current_pred: torch.Tensor, previous_pred: torch.Tensor) -> float:
    current_lane = current_pred == 1
    previous_lane = previous_pred == 1
    return torch.logical_xor(current_lane, previous_lane).float().mean().item() * 100.0

@torch.no_grad()
def evaluate_model(model: MultiTaskRoadPerceptionNet, dataloader: DataLoader, device: str = 'cpu') -> Dict:
    model.eval()
    model.to(device)

    metrics_by_weather = {
        split: {'lane_iou': [], 'lane_f1': [], 'drivable_iou': [], 'ctir': [], 'flicker': []}
        for split in ('overall', 'clear', 'rain', 'fog', 'night_glare', 'transition')
    }

    for batch in dataloader:
        images = batch['images'].to(device) # [B, T, 3, H, W]
        lane_targets = batch['lane_masks'].to(device)
        drivable_targets = batch['drivable_masks'].to(device)
        weathers = batch['weather']
        lane_valid = batch.get('lane_valid', torch.ones(images.shape[0], dtype=torch.bool))
        drivable_valid = batch.get('drivable_valid', torch.ones(images.shape[0], dtype=torch.bool))

        outputs = model(images)
        lane_preds = torch.argmax(outputs['lane_logits'], dim=1) # [B, H, W]
        drivable_preds = torch.argmax(outputs['drivable_logits'], dim=1) # [B, H, W]
        sequence_lane_logits = outputs.get('sequence_lane_logits')

        for i in range(images.shape[0]):
            w = weathers[i]
            ctir = compute_ctir(lane_preds[i], drivable_preds[i])
            lane_ious = compute_iou(lane_preds[i], lane_targets[i], 2) if lane_valid[i] else []
            l_iou = lane_ious[1] if len(lane_ious) > 1 else 0.0
            lane_f1 = compute_f1(lane_preds[i], lane_targets[i]) if lane_valid[i] else float('nan')
            drivable_ious = compute_iou(drivable_preds[i], drivable_targets[i], 3) if drivable_valid[i] else []
            d_iou = np.mean(drivable_ious) if drivable_ious else float('nan')
            flicker = float('nan')
            if sequence_lane_logits is not None and sequence_lane_logits.shape[1] > 1:
                previous_pred = torch.argmax(sequence_lane_logits[i, -2], dim=0)
                flicker = compute_flicker(lane_preds[i], previous_pred)

            # Accumulate overall
            if lane_valid[i]:
                metrics_by_weather['overall']['lane_iou'].append(l_iou)
                metrics_by_weather['overall']['lane_f1'].append(lane_f1)
            if drivable_valid[i]:
                metrics_by_weather['overall']['drivable_iou'].append(d_iou)
            metrics_by_weather['overall']['ctir'].append(ctir)
            metrics_by_weather['overall']['flicker'].append(flicker)

            # Accumulate per weather split
            if w in metrics_by_weather:
                if lane_valid[i]:
                    metrics_by_weather[w]['lane_iou'].append(l_iou)
                    metrics_by_weather[w]['lane_f1'].append(lane_f1)
                if drivable_valid[i]:
                    metrics_by_weather[w]['drivable_iou'].append(d_iou)
                metrics_by_weather[w]['ctir'].append(ctir)
                metrics_by_weather[w]['flicker'].append(flicker)

    # Summarize results
    summary = {}
    for w, scores in metrics_by_weather.items():
        summary[w] = {
            'Lane_IoU': np.mean(scores['lane_iou']) if scores['lane_iou'] else 0.0,
            'Lane_F1': np.mean(scores['lane_f1']) if scores['lane_f1'] else 0.0,
            'Drivable_mIoU': np.mean(scores['drivable_iou']) if scores['drivable_iou'] else 0.0,
            'CTIR_percent': np.nanmean(scores['ctir']) if scores['ctir'] else 0.0,
            'Flicker_percent': np.nanmean(scores['flicker']) if scores['flicker'] else 0.0,
        }

    return summary

if __name__ == '__main__':
    print('=' * 60)
    print('LumiDrive / RoadSight: Multi-Task Road Perception Benchmark')
    print('=' * 60)
    
    parser = argparse.ArgumentParser(description='Evaluate a trained LumiDrive checkpoint')
    parser.add_argument('--weights', required=True, help='Path to a trained .pth checkpoint')
    parser.add_argument('--device', default=None, help='cpu or cuda; defaults to auto')
    parser.add_argument('--dataset', choices=['synthetic', 'mixed', 'culane'], default='synthetic')
    parser.add_argument('--data-root', default=None, help='Local CULane root')
    parser.add_argument('--bdd-root', action='append', default=[], help='BDD100K root; repeat for both Kaggle packages')
    parser.add_argument('--shift-root', default=None, help='Local SHIFT image root')
    parser.add_argument('--drive-root', default=None, help='Local Google Drive image root')
    args = parser.parse_args()

    device = args.device or ('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Running on compute device: {device}')

    # Instantiate model
    model = MultiTaskRoadPerceptionNet(use_temporal=True)
    model.load_state_dict(torch.load(args.weights, map_location=device))
    if args.dataset == 'culane':
        if not args.data_root:
            parser.error('--data-root is required when --dataset culane is selected')
        dataset = CULaneSequenceDataset(args.data_root, split='val', seq_len=4)
        print('Evaluating genuine CULane lane labels; drivable metrics use a geometric proxy.')
    elif args.dataset == 'mixed':
        validation_parts = []
        if args.data_root:
            validation_parts.append(CULaneSequenceDataset(args.data_root, split='val', seq_len=4))
        for root in args.bdd_root:
            validation_parts.append(BDD100KSequenceDataset(root, split='val', seq_len=4, augment=False))
        for root in (args.shift_root, args.drive_root):
            if root:
                validation_parts.append(UnlabeledImageSequenceDataset(root, seq_len=4))
        if not validation_parts:
            parser.error('mixed evaluation requires at least one dataset root')
        dataset = MixedRoadDataset(validation_parts)
    else:
        dataset = RoadPerceptionSequenceDataset(num_samples=50, seq_len=4, augment_weather=True, sample_offset=20000)
    loader = DataLoader(dataset, batch_size=4, shuffle=False, collate_fn=collate_source_flags)

    print(f'Evaluating model on {args.dataset} sequence test set...')
    results = evaluate_model(model, loader, device=device)

    print('\nBenchmark Results Table:')
    print(f"{'Weather Split':<16} | {'Lane IoU':<10} | {'Lane F1':<10} | {'Drivable mIoU':<14} | {'Flicker %':<10} | {'CTIR %':<10}")
    print('-' * 70)
    for split, res in results.items():
        print(f"{split:<16} | {res['Lane_IoU']:<10.4f} | {res['Lane_F1']:<10.4f} | {res['Drivable_mIoU']:<14.4f} | {res['Flicker_percent']:<10.2f} | {res['CTIR_percent']:<10.2f}")
