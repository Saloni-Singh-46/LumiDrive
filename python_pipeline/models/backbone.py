"""
Lightweight Multi-Scale Backbone with Cross-Stage Partial (CSP) Blocks and Feature Pyramid Network (FPN)
Optimized for real-time edge autonomous driving perception.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBNAct(nn.Module):
    """Standard Convolution + BatchNorm + Activation block"""
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int = 3, 
                 stride: int = 1, padding: int = 1, act: str = 'silu'):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.act = nn.SiLU(inplace=True) if act == 'silu' else nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.act(self.bn(self.conv(x)))

class Bottleneck(nn.Module):
    """Residual bottleneck block"""
    def __init__(self, channels: int, shortcut: bool = True, expansion: float = 0.5):
        super().__init__()
        hidden_channels = int(channels * expansion)
        self.cv1 = ConvBNAct(channels, hidden_channels, kernel_size=1, stride=1, padding=0)
        self.cv2 = ConvBNAct(hidden_channels, channels, kernel_size=3, stride=1, padding=1)
        self.add = shortcut

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.cv2(self.cv1(x)) if self.add else self.cv2(self.cv1(x))

class CSPBlock(nn.Module):
    """Cross Stage Partial block for rich gradient combination and low latency"""
    def __init__(self, in_channels: int, out_channels: int, num_blocks: int = 2):
        super().__init__()
        hidden_channels = out_channels // 2
        self.cv1 = ConvBNAct(in_channels, hidden_channels, kernel_size=1, stride=1, padding=0)
        self.cv2 = ConvBNAct(in_channels, hidden_channels, kernel_size=1, stride=1, padding=0)
        self.cv3 = ConvBNAct(hidden_channels * 2, out_channels, kernel_size=1, stride=1, padding=0)
        
        self.blocks = nn.Sequential(*[
            Bottleneck(hidden_channels, shortcut=True) for _ in range(num_blocks)
        ])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        y1 = self.blocks(self.cv1(x))
        y2 = self.cv2(x)
        return self.cv3(torch.cat((y1, y2), dim=1))

class LightweightBackbone(nn.Module):
    """
    Hierarchical 4-stage convolutional backbone returning multi-scale feature maps:
    - Stage 1 (Stem): 1/2 resolution
    - Stage 2: 1/4 resolution
    - Stage 3 (C3): 1/8 resolution  (channels: 64)
    - Stage 4 (C4): 1/16 resolution (channels: 128)
    - Stage 5 (C5): 1/32 resolution (channels: 256)
    """
    def __init__(self, in_channels: int = 3):
        super().__init__()
        # Stem
        self.stem = nn.Sequential(
            ConvBNAct(in_channels, 32, kernel_size=3, stride=2, padding=1),  # 1/2
            ConvBNAct(32, 48, kernel_size=3, stride=2, padding=1),           # 1/4
        )
        
        # Stages
        self.stage3 = nn.Sequential(
            ConvBNAct(48, 64, kernel_size=3, stride=2, padding=1),           # 1/8
            CSPBlock(64, 64, num_blocks=2)
        )
        self.stage4 = nn.Sequential(
            ConvBNAct(64, 128, kernel_size=3, stride=2, padding=1),          # 1/16
            CSPBlock(128, 128, num_blocks=3)
        )
        self.stage5 = nn.Sequential(
            ConvBNAct(128, 256, kernel_size=3, stride=2, padding=1),         # 1/32
            CSPBlock(256, 256, num_blocks=2)
        )

    def forward(self, x: torch.Tensor):
        x = self.stem(x)
        c3 = self.stage3(x)   # B x 64 x H/8 x W/8
        c4 = self.stage4(c3)  # B x 128 x H/16 x W/16
        c5 = self.stage5(c4)  # B x 256 x H/32 x W/32
        return c3, c4, c5

class FeaturePyramidNetwork(nn.Module):
    """
    Top-down Feature Pyramid Network (FPN) + Bottom-up PANet pathway
    Fuses semantic and fine spatial features into unified feature representations:
    - P3 (1/8 scale, 128 channels)
    - P4 (1/16 scale, 128 channels)
    - P5 (1/32 scale, 128 channels)
    """
    def __init__(self, in_channels_list=(64, 128, 256), out_channels=128):
        super().__init__()
        c3_ch, c4_ch, c5_ch = in_channels_list
        
        self.lateral_c5 = ConvBNAct(c5_ch, out_channels, kernel_size=1, stride=1, padding=0)
        self.lateral_c4 = ConvBNAct(c4_ch, out_channels, kernel_size=1, stride=1, padding=0)
        self.lateral_c3 = ConvBNAct(c3_ch, out_channels, kernel_size=1, stride=1, padding=0)
        
        self.smooth_p4 = ConvBNAct(out_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.smooth_p3 = ConvBNAct(out_channels, out_channels, kernel_size=3, stride=1, padding=1)

    def forward(self, c3: torch.Tensor, c4: torch.Tensor, c5: torch.Tensor):
        p5 = self.lateral_c5(c5)
        
        # Up-sample P5 and add to C4
        p4 = self.lateral_c4(c4) + F.interpolate(p5, size=c4.shape[-2:], mode='nearest')
        p4 = self.smooth_p4(p4)
        
        # Up-sample P4 and add to C3
        p3 = self.lateral_c3(c3) + F.interpolate(p4, size=c3.shape[-2:], mode='nearest')
        p3 = self.smooth_p3(p3)
        
        return p3, p4, p5
