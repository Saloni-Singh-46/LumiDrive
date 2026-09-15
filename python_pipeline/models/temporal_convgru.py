"""
Spatiotemporal Convolutional Gated Recurrent Unit (ConvGRU) with Spatial Memory Gating.
Enables recurrent temporal context propagation across video frames to eliminate
lane detection flicker and bridge occlusions caused by water splash, headlight glare, or fog.
"""

import torch
import torch.nn as nn

class ConvGRUCell(nn.Module):
    """
    2D Convolutional Gated Recurrent Unit Cell for Spatiotemporal Feature Aggregation.
    """
    def __init__(self, in_channels: int, hidden_channels: int, kernel_size: int = 3):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_channels = hidden_channels
        padding = kernel_size // 2

        # Reset gate (r) and Update gate (z) joint convolution
        self.conv_gates = nn.Conv2d(
            in_channels + hidden_channels, 
            2 * hidden_channels, 
            kernel_size=kernel_size, 
            padding=padding, 
            bias=True
        )

        # Candidate hidden state (h_tilde) convolution
        self.conv_candidate = nn.Conv2d(
            in_channels + hidden_channels, 
            hidden_channels, 
            kernel_size=kernel_size, 
            padding=padding, 
            bias=True
        )

    def forward(self, x: torch.Tensor, h_prev: torch.Tensor = None) -> torch.Tensor:
        """
        x: [B, C_in, H, W]
        h_prev: [B, C_hidden, H, W]
        """
        batch_size, _, height, width = x.shape

        if h_prev is None:
            h_prev = torch.zeros(
                batch_size, self.hidden_channels, height, width, 
                device=x.device, dtype=x.dtype
            )

        # Compute reset (r) and update (z) gates
        combined = torch.cat([x, h_prev], dim=1)
        gates = self.conv_gates(combined)
        z, r = torch.chunk(gates, 2, dim=1)
        z = torch.sigmoid(z)
        r = torch.sigmoid(r)

        # Candidate memory
        combined_candidate = torch.cat([x, r * h_prev], dim=1)
        h_tilde = torch.tanh(self.conv_candidate(combined_candidate))

        # Final updated hidden state
        h_next = (1 - z) * h_prev + z * h_tilde
        return h_next

class TransitionAwareTemporalAggregator(nn.Module):
    """
    Processes a sequence of T multi-scale feature frames through a ConvGRU
    with weather-transition adaptive spatial attention.
    """
    def __init__(self, channels: int = 128, kernel_size: int = 3):
        super().__init__()
        self.conv_gru = ConvGRUCell(channels, channels, kernel_size)
        
        # Spatial Attention Refinement Gate
        self.spatial_gate = nn.Sequential(
            nn.Conv2d(channels * 2, channels // 2, kernel_size=1),
            nn.BatchNorm2d(channels // 2),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // 2, 1, kernel_size=3, padding=1),
            nn.Sigmoid()
        )
        
        self.out_conv = nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
            nn.SiLU(inplace=True)
        )

    def forward(self, sequence_features: torch.Tensor) -> torch.Tensor:
        """
        sequence_features: [B, T, C, H, W] (T consecutive temporal frames)
        Returns: [B, C, H, W] aggregated temporally-stabilized feature for the current frame (T-1)
        """
        _, T, _, _, _ = sequence_features.shape
        h = None

        for t in range(T):
            x_t = sequence_features[:, t] # [B, C, H, W]
            h = self.conv_gru(x_t, h)

        # Refine current frame feature with temporal hidden state via spatial attention
        current_x = sequence_features[:, -1]
        concat_feat = torch.cat([current_x, h], dim=1)
        att_map = self.spatial_gate(concat_feat) # [B, 1, H, W]

        # Fusion: adaptive gate balances instantaneous sensory data with accumulated temporal memory
        fused = att_map * current_x + (1 - att_map) * h
        out = self.out_conv(fused)
        return out
