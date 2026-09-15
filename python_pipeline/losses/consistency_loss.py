"""
Comprehensive Loss Functions for Multi-Task Road Perception.
Includes:
- Cross-Task Consistency Loss (L_CTC)
- Temporal Flicker Regularization Loss (L_temp)
- Focal Loss & Generalized Dice Loss
- Unified Multi-Task Objective
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """Focal loss for handling extreme foreground/background class imbalance."""
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, reduction: str = 'mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss.mean() if self.reduction == 'mean' else focal_loss.sum()

class DiceLoss(nn.Module):
    """Soft Dice Loss for precise lane and drivable boundary overlap."""
    def __init__(self, smooth: float = 1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = F.softmax(logits, dim=1)
        num_classes = logits.shape[1]
        
        # One-hot encode targets
        targets_one_hot = F.one_hot(targets, num_classes=num_classes).permute(0, 3, 1, 2).float()
        
        # Compute dice across foreground classes
        dims = (0, 2, 3)
        intersection = torch.sum(probs[:, 1:] * targets_one_hot[:, 1:], dims)
        cardinality = torch.sum(probs[:, 1:] + targets_one_hot[:, 1:], dims)
        dice_score = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
        return 1.0 - torch.mean(dice_score)

class CrossTaskConsistencyLoss(nn.Module):
    """
    Novel Cross-Task Consistency (CTC) Regularizer.
    Penalizes semantic contradictions: lane markings predicted outside the expanded 
    drivable road envelope or drivable area expanding past lane boundaries without visual support.
    """
    def __init__(self, boundary_dilation: int = 5):
        super().__init__()
        self.dilation = boundary_dilation

    def forward(self, lane_logits: torch.Tensor, drivable_logits: torch.Tensor) -> torch.Tensor:
        """
        lane_logits: [B, 2, H, W] (Class 1 = Lane)
        drivable_logits: [B, 3, H, W] (Class 0 = Background, Class 1 = Main Lane, Class 2 = Alt)
        """
        lane_prob = torch.softmax(lane_logits, dim=1)[:, 1:2] # [B, 1, H, W]
        drivable_prob = torch.softmax(drivable_logits, dim=1)[:, 1:].sum(dim=1, keepdim=True) # [B, 1, H, W]

        # Dilate drivable area slightly to account for outer lane marker boundaries
        drivable_envelope = F.max_pool2d(
            drivable_prob, 
            kernel_size=self.dilation * 2 + 1, 
            stride=1, 
            padding=self.dilation
        )

        # Inconsistency: High lane probability where drivable envelope is zero
        lane_outside_drivable = lane_prob * (1.0 - drivable_envelope)
        ctc_loss = torch.mean(lane_outside_drivable)
        return ctc_loss

class TemporalFlickerLoss(nn.Module):
    """
    Temporal Smoothness / Flicker Regularization across consecutive video frames.
    Penalizes abrupt spurious mask oscillations during rain spray and sensor blooming.
    """
    def __init__(self):
        super().__init__()

    def forward(self, curr_logits: torch.Tensor, prev_logits: torch.Tensor) -> torch.Tensor:
        p_curr = torch.softmax(curr_logits, dim=1)[:, 1:2]
        p_prev = torch.softmax(prev_logits, dim=1)[:, 1:2]
        flicker = torch.abs(p_curr - p_prev)
        return torch.mean(flicker)

class MultiTaskTotalLoss(nn.Module):
    """
    Unified Multi-Task Loss with Cross-Task and Temporal Regularization:
    L = w_lane*L_lane + w_drivable*L_drivable + w_ctc*L_ctc + w_temp*L_temp
    """
    def __init__(self, 
                 w_lane: float = 1.5, 
                 w_drivable: float = 1.0, 
                 w_ctc: float = 0.6, 
                 w_temp: float = 0.4):
        super().__init__()
        self.w_lane = w_lane
        self.w_drivable = w_drivable
        self.w_ctc = w_ctc
        self.w_temp = w_temp

        self.focal_loss = FocalLoss()
        self.dice_loss = DiceLoss()
        self.ctc_loss = CrossTaskConsistencyLoss()
        self.temp_loss = TemporalFlickerLoss()

    def forward(self, predictions: dict, targets: dict, prev_lane_logits: torch.Tensor = None) -> dict:
        lane_logits = predictions['lane_logits']
        drivable_logits = predictions['drivable_logits']
        temporal_lane_logits = lane_logits
        lane_targets = targets['lane_masks']
        drivable_targets = targets['drivable_masks']

        lane_valid = targets.get('lane_valid')
        drivable_valid = targets.get('drivable_valid')

        # CULane and image-only domain sources must not contribute fabricated targets.
        if lane_valid is not None:
            lane_logits = lane_logits[lane_valid]
            lane_targets = lane_targets[lane_valid]
        if drivable_valid is not None:
            drivable_logits = drivable_logits[drivable_valid]
            drivable_targets = drivable_targets[drivable_valid]

        zero = predictions['lane_logits'].sum() * 0.0

        # Task 1: Lane Loss (Focal + Dice)
        loss_lane = zero if lane_logits.shape[0] == 0 else (
            self.focal_loss(lane_logits, lane_targets) + self.dice_loss(lane_logits, lane_targets)
        )

        # Task 2: Drivable Area Loss (CrossEntropy + Dice)
        loss_drivable = zero if drivable_logits.shape[0] == 0 else (
            F.cross_entropy(drivable_logits, drivable_targets) + self.dice_loss(drivable_logits, drivable_targets)
        )

        # Task 3: Cross-Task Consistency
        ctc_logits = predictions['lane_logits']
        ctc_drivable_logits = predictions['drivable_logits']
        if lane_valid is not None and drivable_valid is not None:
            both_valid = lane_valid & drivable_valid
            ctc_logits = ctc_logits[both_valid]
            ctc_drivable_logits = ctc_drivable_logits[both_valid]
        loss_ctc = zero if ctc_logits.shape[0] == 0 else self.ctc_loss(ctc_logits, ctc_drivable_logits)

        # Task 4: Temporal Regularization (if previous frame logits are provided)
        loss_temp = torch.tensor(0.0, device=lane_logits.device)
        if prev_lane_logits is not None:
            loss_temp = self.temp_loss(temporal_lane_logits, prev_lane_logits)

        # Total Weighted Loss
        total_loss = (
            self.w_lane * loss_lane + 
            self.w_drivable * loss_drivable + 
            self.w_ctc * loss_ctc + 
            self.w_temp * loss_temp
        )

        return {
            'total_loss': total_loss,
            'loss_lane': loss_lane,
            'loss_drivable': loss_drivable,
            'loss_ctc': loss_ctc,
            'loss_temp': loss_temp
        }
