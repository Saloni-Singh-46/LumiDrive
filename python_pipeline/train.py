"""
Training Pipeline for Spatiotemporal Multi-Task Road Perception Network.
Supports mixed-precision training, cosine annealing learning rate schedule,
and validation checkpointing.
"""

import os
import time
import argparse
import torch
from torch.utils.data import DataLoader
from models.multitask_network import MultiTaskRoadPerceptionNet
from losses.consistency_loss import MultiTaskTotalLoss
from data.dataset import RoadPerceptionSequenceDataset
from data.culane_dataset import CULaneSequenceDataset
from data.bdd100k_dataset import BDD100KSequenceDataset
from data.unlabeled_dataset import UnlabeledImageSequenceDataset
from data.mixed_dataset import MixedRoadDataset, collate_source_flags
from evaluate import evaluate_model

def train(
    epochs: int = 15,
    batch_size: int = 4,
    lr: float = 1e-3,
    seq_len: int = 4,
    save_dir: str = 'weights',
    device: str = 'cpu',
    dataset_name: str = 'synthetic',
    data_root: str = None,
    bdd_roots: list[str] | None = None,
    shift_root: str = None,
    drive_root: str = None,
):
    os.makedirs(save_dir, exist_ok=True)
    print("=" * 60)
    print("Initializing LumiDrive Multi-Task Training Pipeline")
    print(f"Epochs: {epochs} | Batch Size: {batch_size} | Learning Rate: {lr}")
    print(f"Temporal Window (T): {seq_len} frames | Device: {device}")
    print("=" * 60)

    # 1. Dataset & DataLoaders
    if dataset_name == 'synthetic':
        train_dataset = RoadPerceptionSequenceDataset(
            num_samples=160, seq_len=seq_len, augment_weather=True, sample_offset=0
        )
        val_dataset = RoadPerceptionSequenceDataset(
            num_samples=40, seq_len=seq_len, augment_weather=True, sample_offset=10000
        )
    else:
        train_parts = []
        val_parts = []
        if data_root:
            train_parts.append(CULaneSequenceDataset(data_root, split='train', seq_len=seq_len))
            val_parts.append(CULaneSequenceDataset(data_root, split='val', seq_len=seq_len))
            print('Using CULane lane labels only; drivable masks are excluded from loss.')
        for root in bdd_roots or []:
            train_parts.append(BDD100KSequenceDataset(root, split='train', seq_len=seq_len))
            val_parts.append(BDD100KSequenceDataset(root, split='val', seq_len=seq_len, augment=False))
        for root, label in ((shift_root, 'SHIFT'), (drive_root, 'Google Drive')):
            if root:
                train_parts.append(UnlabeledImageSequenceDataset(root, seq_len=seq_len))
                print(f'Using {label} as unlabeled domain-shift data; no segmentation targets are fabricated.')
        train_dataset = MixedRoadDataset(train_parts)
        val_dataset = MixedRoadDataset(val_parts) if val_parts else train_dataset

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=True, collate_fn=collate_source_flags)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, collate_fn=collate_source_flags)

    # 2. Model, Loss, Optimizer, Scheduler
    model = MultiTaskRoadPerceptionNet(use_temporal=True).to(device)
    criterion = MultiTaskTotalLoss(w_lane=1.5, w_drivable=1.0, w_ctc=0.6, w_temp=0.4)

    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    scaler = torch.cuda.amp.GradScaler(enabled=(device == 'cuda'))

    best_val_score = 0.0

    # 3. Training Loop
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss_accum = 0.0
        lane_loss_accum = 0.0
        drivable_loss_accum = 0.0
        ctc_loss_accum = 0.0
        temporal_loss_accum = 0.0
        start_time = time.time()

        for batch in train_loader:
            images = batch['images'].to(device) # [B, T, 3, H, W]
            targets = {
                'lane_masks': batch['lane_masks'].to(device),
                'drivable_masks': batch['drivable_masks'].to(device),
                'lane_valid': batch['lane_valid'].to(device),
                'drivable_valid': batch['drivable_valid'].to(device),
            }

            optimizer.zero_grad()

            with torch.cuda.amp.autocast(enabled=(device == 'cuda')):
                outputs = model(images)
                previous_lane_logits = None
                sequence_lane_logits = outputs.get('sequence_lane_logits')
                if sequence_lane_logits is not None and sequence_lane_logits.shape[1] > 1:
                    previous_lane_logits = sequence_lane_logits[:, -2].detach()
                loss_dict = criterion(outputs, targets, prev_lane_logits=previous_lane_logits)
                loss = loss_dict['total_loss']

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            total_loss_accum += loss.item()
            lane_loss_accum += loss_dict['loss_lane'].item()
            drivable_loss_accum += loss_dict['loss_drivable'].item()
            ctc_loss_accum += loss_dict['loss_ctc'].item()
            temporal_loss_accum += loss_dict['loss_temp'].item()

        scheduler.step()
        epoch_time = time.time() - start_time
        avg_loss = total_loss_accum / len(train_loader)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_time:.1f}s) - "
              f"Total Loss: {avg_loss:.4f} | Lane: {lane_loss_accum/len(train_loader):.4f} | "
              f"Drivable: {drivable_loss_accum/len(train_loader):.4f} | "
              f"CTC: {ctc_loss_accum/len(train_loader):.4f} | "
              f"Temporal: {temporal_loss_accum/len(train_loader):.4f}")

        # Validation Step
        if epoch % 5 == 0 or epoch == epochs:
            print("--> Running Validation Evaluation...")
            eval_summary = evaluate_model(model, val_loader, device=device)
            overall_lane = eval_summary['overall']['Lane_IoU']
            overall_drivable = eval_summary['overall']['Drivable_mIoU']
            overall_ctir = eval_summary['overall']['CTIR_percent']
            
            val_score = (overall_lane + overall_drivable) / 2.0
            print(f"    Val Lane IoU: {overall_lane:.4f} | Drivable mIoU: {overall_drivable:.4f} | CTIR: {overall_ctir:.2f}%")

            if val_score > best_val_score:
                best_val_score = val_score
                best_path = os.path.join(save_dir, 'best_model.pth')
                torch.save(model.state_dict(), best_path)
                print(f"    *** New Best Model Checkpoint Saved to {best_path} ***")

    # Save final checkpoint
    final_path = os.path.join(save_dir, 'latest_checkpoint.pth')
    torch.save(model.state_dict(), final_path)
    print(f"\nTraining completed! Saved latest checkpoint to: {final_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="LumiDrive Model Training")
    parser.add_argument('--epochs', type=int, default=10, help="Number of training epochs")
    parser.add_argument('--batch-size', type=int, default=4, help="Batch size")
    parser.add_argument('--lr', type=float, default=1e-3, help="Learning rate")
    parser.add_argument('--device', type=str, default='cpu', help="Device ('cpu' or 'cuda')")
    parser.add_argument('--dataset', choices=['synthetic', 'mixed', 'culane'], default='synthetic')
    parser.add_argument('--data-root', type=str, default=None, help='Local CULane root')
    parser.add_argument('--bdd-root', action='append', default=[], help='BDD100K root; repeat for both Kaggle packages')
    parser.add_argument('--shift-root', type=str, default=None, help='Local SHIFT image root (unlabeled domain data)')
    parser.add_argument('--drive-root', type=str, default=None, help='Local Google Drive image root (unlabeled domain data)')
    args = parser.parse_args()

    train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        device=args.device,
        dataset_name=args.dataset,
        data_root=args.data_root,
        bdd_roots=args.bdd_root,
        shift_root=args.shift_root,
        drive_root=args.drive_root,
    )
