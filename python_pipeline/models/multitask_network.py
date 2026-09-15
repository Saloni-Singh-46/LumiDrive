"""
Unified Multi-Task Panoptic Road Perception Network (LumiDrive / RoadSight)
Performs joint Lane Detection, Drivable Free-Space Segmentation, and Obstacle Detection
with Spatiotemporal Memory Aggregation.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from .backbone import LightweightBackbone, FeaturePyramidNetwork, ConvBNAct
from .temporal_convgru import TransitionAwareTemporalAggregator

class LaneSegmentationHead(nn.Module):
    """
    High-resolution lane line segmentation head with boundary enhancement convolutions.
    """
    def __init__(self, in_channels: int = 128, num_classes: int = 2):
        super().__init__()
        self.conv1 = ConvBNAct(in_channels, 64, kernel_size=3, padding=1)
        self.conv2 = ConvBNAct(64, 32, kernel_size=3, padding=1)
        self.classifier = nn.Conv2d(32, num_classes, kernel_size=1)

    def forward(self, p3: torch.Tensor, target_size: tuple) -> torch.Tensor:
        x = self.conv1(p3)
        x = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=False) # 1/4
        x = self.conv2(x)
        x = F.interpolate(x, size=target_size, mode='bilinear', align_corners=False) # Full scale
        logits = self.classifier(x)
        return logits

class DrivableAreaHead(nn.Module):
    """
    Multi-class drivable area semantic segmentation head (Background, Main Lane, Alternate Lane).
    """
    def __init__(self, in_channels: int = 128, num_classes: int = 3):
        super().__init__()
        self.conv1 = ConvBNAct(in_channels, 64, kernel_size=3, padding=1)
        self.conv2 = ConvBNAct(64, 32, kernel_size=3, padding=1)
        self.classifier = nn.Conv2d(32, num_classes, kernel_size=1)

    def forward(self, p3: torch.Tensor, target_size: tuple) -> torch.Tensor:
        x = self.conv1(p3)
        x = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=False) # 1/4
        x = self.conv2(x)
        x = F.interpolate(x, size=target_size, mode='bilinear', align_corners=False) # Full scale
        logits = self.classifier(x)
        return logits

class ObjectDetectionHead(nn.Module):
    """
    Anchor-free vehicle and obstacle detection head across multi-scale FPN levels (P3, P4, P5).
    Predicts Objectness heatmap, Classification logits, and Bounding Box offsets (dx, dy, dw, dh).
    """
    def __init__(self, in_channels: int = 128, num_classes: int = 4):
        super().__init__()
        self.cls_convs = nn.Sequential(
            ConvBNAct(in_channels, in_channels, kernel_size=3, padding=1),
            ConvBNAct(in_channels, in_channels, kernel_size=3, padding=1)
        )
        self.reg_convs = nn.Sequential(
            ConvBNAct(in_channels, in_channels, kernel_size=3, padding=1),
            ConvBNAct(in_channels, in_channels, kernel_size=3, padding=1)
        )

        self.cls_pred = nn.Conv2d(in_channels, num_classes, kernel_size=1)
        self.reg_pred = nn.Conv2d(in_channels, 4, kernel_size=1)
        self.obj_pred = nn.Conv2d(in_channels, 1, kernel_size=1)

    def forward(self, feat: torch.Tensor):
        cls_feat = self.cls_convs(feat)
        reg_feat = self.reg_convs(feat)

        cls_scores = self.cls_pred(cls_feat)
        bbox_regs = self.reg_pred(reg_feat)
        obj_scores = torch.sigmoid(self.obj_pred(reg_feat))

        return {
            'cls': cls_scores,
            'reg': bbox_regs,
            'obj': obj_scores
        }

class MultiTaskRoadPerceptionNet(nn.Module):
    """
    Complete Multi-Task Architecture:
    Shared Backbone + FPN + Spatiotemporal ConvGRU + Lane Head + Drivable Head + Object Head
    """
    def __init__(self, num_classes_lane: int = 2, num_classes_drivable: int = 3, 
                 num_classes_objects: int = 4, use_temporal: bool = True):
        super().__init__()
        self.use_temporal = use_temporal

        # 1. Feature Extractor
        self.backbone = LightweightBackbone(in_channels=3)
        self.fpn = FeaturePyramidNetwork(in_channels_list=(64, 128, 256), out_channels=128)

        # 2. Spatiotemporal Memory Aggregator
        if self.use_temporal:
            self.temporal_aggregator = TransitionAwareTemporalAggregator(channels=128)

        # 3. Dedicated Task Heads
        self.lane_head = LaneSegmentationHead(in_channels=128, num_classes=num_classes_lane)
        self.drivable_head = DrivableAreaHead(in_channels=128, num_classes=num_classes_drivable)
        self.object_head_p3 = ObjectDetectionHead(in_channels=128, num_classes=num_classes_objects)
        self.object_head_p4 = ObjectDetectionHead(in_channels=128, num_classes=num_classes_objects)
        self.object_head_p5 = ObjectDetectionHead(in_channels=128, num_classes=num_classes_objects)

    def forward(self, x: torch.Tensor) -> dict:
        """
        x: [B, T, 3, H, W] for sequence mode, or [B, 3, H, W] for single-frame inference
        """
        if x.dim() == 5:
            B, T, C, H, W = x.shape
            # Extract features for all temporal frames in batch
            x_flat = x.view(B * T, C, H, W)
            c3, c4, c5 = self.backbone(x_flat)
            p3, p4, p5 = self.fpn(c3, c4, c5)

            # Reshape P3 to temporal sequence [B, T, 128, H/8, W/8]
            p3_seq = p3.view(B, T, 128, p3.shape[-2], p3.shape[-1])
            
            if self.use_temporal:
                p3_fused = self.temporal_aggregator(p3_seq)
            else:
                p3_fused = p3_seq[:, -1]

            # Current frame P4 and P5
            p4_curr = p4.view(B, T, 128, p4.shape[-2], p4.shape[-1])[:, -1]
            p5_curr = p5.view(B, T, 128, p5.shape[-2], p5.shape[-1])[:, -1]
            target_size = (H, W)
        else:
            B, C, H, W = x.shape
            c3, c4, c5 = self.backbone(x)
            p3, p4, p5 = self.fpn(c3, c4, c5)
            p3_fused = p3
            p4_curr = p4
            p5_curr = p5
            target_size = (H, W)

        # Multi-task predictions
        lane_logits = self.lane_head(p3_fused, target_size)
        drivable_logits = self.drivable_head(p3_fused, target_size)

        sequence_lane_logits = None
        if x.dim() == 5:
            sequence_lane_logits = torch.stack(
                [self.lane_head(p3_seq[:, frame_idx], target_size) for frame_idx in range(T)],
                dim=1
            )
        
        obj_p3 = self.object_head_p3(p3_fused)
        obj_p4 = self.object_head_p4(p4_curr)
        obj_p5 = self.object_head_p5(p5_curr)

        return {
            'lane_logits': lane_logits,           # [B, 2, H, W]
            'drivable_logits': drivable_logits,   # [B, 3, H, W]
            'sequence_lane_logits': sequence_lane_logits,
            'objects': [obj_p3, obj_p4, obj_p5]   # Multi-scale detections
        }
