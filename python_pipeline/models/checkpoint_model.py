"""Architecture used to train the checked-in Colab checkpoint."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBNAct(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int = 3, stride: int = 1, padding: int = 1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.SiLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class LightweightBackbone(nn.Module):
    def __init__(self):
        super().__init__()
        self.stem = ConvBNAct(3, 32, stride=2)
        self.stage1 = ConvBNAct(32, 64, stride=2)
        self.stage2 = ConvBNAct(64, 128, stride=2)
        self.stage3 = ConvBNAct(128, 256, stride=2)


class FeaturePyramidNetwork(nn.Module):
    def __init__(self, in_channels: tuple[int, int, int] = (64, 128, 256), out_channels: int = 128):
        super().__init__()
        self.lat5 = nn.Conv2d(in_channels[2], out_channels, 1)
        self.lat4 = nn.Conv2d(in_channels[1], out_channels, 1)
        self.lat3 = nn.Conv2d(in_channels[0], out_channels, 1)
        self.smooth = ConvBNAct(out_channels, out_channels, 3, padding=1)

    def forward(self, c3: torch.Tensor, c4: torch.Tensor, c5: torch.Tensor):
        p5 = self.lat5(c5)
        p4 = self.lat4(c4) + F.interpolate(p5, size=c4.shape[-2:], mode='bilinear', align_corners=False)
        p3 = self.lat3(c3) + F.interpolate(p4, size=c3.shape[-2:], mode='bilinear', align_corners=False)
        return self.smooth(p3), p4, p5


class ConvGRUCell(nn.Module):
    def __init__(self, channels: int = 128):
        super().__init__()
        self.conv_gates = nn.Conv2d(channels * 2, channels * 2, kernel_size=3, padding=1)
        self.conv_cand = nn.Conv2d(channels * 2, channels, kernel_size=3, padding=1)

    def forward(self, x: torch.Tensor, h_prev: torch.Tensor) -> torch.Tensor:
        combined = torch.cat([x, h_prev], dim=1)
        gates = torch.sigmoid(self.conv_gates(combined))
        reset_gate, update_gate = torch.chunk(gates, 2, dim=1)
        candidate_input = torch.cat([x, reset_gate * h_prev], dim=1)
        candidate = torch.tanh(self.conv_cand(candidate_input))
        return (1.0 - update_gate) * h_prev + update_gate * candidate


class TemporalMemoryAggregator(nn.Module):
    def __init__(self, channels: int = 128):
        super().__init__()
        self.conv_gru = ConvGRUCell(channels)
        self.spatial_gate = nn.Sequential(
            nn.Conv2d(channels * 2, channels // 2, kernel_size=3, padding=1),
            nn.SiLU(),
            nn.Conv2d(channels // 2, 1, kernel_size=1),
            nn.Sigmoid(),
        )
        self.out_proj = ConvBNAct(channels, channels, kernel_size=3, padding=1)

    def forward(self, sequence_features: torch.Tensor) -> torch.Tensor:
        batch_size, sequence_length, channels, height, width = sequence_features.shape
        hidden = torch.zeros(batch_size, channels, height, width, device=sequence_features.device)
        for frame_index in range(sequence_length):
            hidden = self.conv_gru(sequence_features[:, frame_index], hidden)
        current = sequence_features[:, -1]
        gate = self.spatial_gate(torch.cat([current, hidden], dim=1))
        return self.out_proj(gate * current + (1.0 - gate) * hidden)


class CheckpointRoadPerceptionNet(nn.Module):
    """Inference-compatible model for ``lumidrive_best_model.pth``."""

    def __init__(self, use_temporal: bool = True):
        super().__init__()
        self.use_temporal = use_temporal
        self.backbone = LightweightBackbone()
        self.fpn = FeaturePyramidNetwork()
        if use_temporal:
            self.temporal_aggregator = TemporalMemoryAggregator(128)
        self.lane_head = nn.Sequential(
            ConvBNAct(128, 64),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            ConvBNAct(64, 32),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            nn.Conv2d(32, 2, kernel_size=1),
        )
        self.drivable_head = nn.Sequential(
            ConvBNAct(128, 64),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            ConvBNAct(64, 32),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            nn.Conv2d(32, 3, kernel_size=1),
        )

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        batch_size, sequence_length, channels, height, width = x.shape
        flattened = x.view(batch_size * sequence_length, channels, height, width)
        c3 = self.backbone.stage1(self.backbone.stem(flattened))
        c4 = self.backbone.stage2(c3)
        c5 = self.backbone.stage3(c4)
        p3, _, _ = self.fpn(c3, c4, c5)
        p3_sequence = p3.view(batch_size, sequence_length, 128, p3.shape[-2], p3.shape[-1])
        fused = self.temporal_aggregator(p3_sequence) if self.use_temporal else p3_sequence[:, -1]
        return {
            'lane_logits': self.lane_head(fused),
            'drivable_logits': self.drivable_head(fused),
        }