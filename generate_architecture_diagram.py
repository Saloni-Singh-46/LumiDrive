"""
High-Resolution IEEE Publication-Grade Neural Network Architecture Diagram for LumiDrive.
Generates:
- results_figures/fig0_network_architecture.png (300 DPI)
- results_figures/fig0_network_architecture.pdf (Vector format)
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = 'results_figures'
os.makedirs(OUT_DIR, exist_ok=True)

fig = plt.figure(figsize=(16, 9.5), dpi=300)
ax = fig.add_subplot(111)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Color Palette (Tailored Academic Modern Scheme)
COLOR_BG = "#F8FAFC"
COLOR_INPUT = "#E2E8F0"
COLOR_BACKBONE = "#E0F2FE"     # Light Cyan/Blue
COLOR_BACKBONE_BORDER = "#0284C7"
COLOR_FPN = "#EDE9FE"          # Light Purple
COLOR_FPN_BORDER = "#7C3AED"
COLOR_CONVGRU = "#CCFBF1"      # Light Teal
COLOR_CONVGRU_BORDER = "#0D9488"
COLOR_HEAD_LANE = "#FEF08A"    # Light Yellow
COLOR_HEAD_LANE_BORDER = "#CA8A04"
COLOR_HEAD_DRIV = "#DCFCE7"    # Light Green
COLOR_HEAD_DRIV_BORDER = "#16A34A"
COLOR_HEAD_OBJ = "#FFEDD5"     # Light Orange
COLOR_HEAD_OBJ_BORDER = "#EA580C"
COLOR_LOSS = "#FFE4E6"         # Light Rose
COLOR_LOSS_BORDER = "#E11D48"

# Background canvas
fig.patch.set_facecolor('#FFFFFF')

# Helper function to draw rounded box with shadow & text
def draw_box(ax, x, y, w, h, title, subtitle="", bg_col="#FFFFFF", border_col="#000000", lw=1.5, title_size=10, sub_size=8, radius=1.2):
    # Shadow
    rect_s = patches.FancyBboxPatch((x+0.3, y-0.3), w, h, boxstyle=f"round,pad={radius},rounding_size={radius}",
                                    facecolor="#CBD5E1", edgecolor="none", alpha=0.4, zorder=1)
    ax.add_patch(rect_s)
    # Main Box
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad={radius},rounding_size={radius}",
                                  facecolor=bg_col, edgecolor=border_col, linewidth=lw, zorder=2)
    ax.add_patch(rect)
    # Text
    if subtitle:
        ax.text(x + w/2, y + h/2 + 1.2, title, ha='center', va='center', fontsize=title_size, fontweight='bold', color='#0F172A', zorder=3)
        ax.text(x + w/2, y + h/2 - 1.5, subtitle, ha='center', va='center', fontsize=sub_size, color='#475569', zorder=3)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=title_size, fontweight='bold', color='#0F172A', zorder=3)

def draw_arrow(ax, x1, y1, x2, y2, color="#475569", lw=1.8, style='->', label="", label_pos=(0,0)):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw, shrinkA=3, shrinkB=3), zorder=4)
    if label:
        ax.text((x1+x2)/2 + label_pos[0], (y1+y2)/2 + label_pos[1], label,
                ha='center', va='center', fontsize=7.5, fontweight='bold', color=color,
                bbox=dict(boxstyle="square,pad=0.2", fc="#FFFFFF", ec="none", alpha=0.8), zorder=5)

# ==============================================================================
# 0. MAIN TITLE & SUBTITLE
# ==============================================================================
ax.text(50, 96.5, "LumiDrive: Spatiotemporal Multi-Task Panoptic Road Perception Architecture",
        ha='center', va='center', fontsize=15, fontweight='bold', color='#0F172A')
ax.text(50, 93.8, "Unified Pipeline for Joint Lane Detection, Drivable Free-Space Segmentation & Obstacle Detection under Adverse Weather",
        ha='center', va='center', fontsize=10, color='#475569')

# ==============================================================================
# 1. INPUT VIDEO SEQUENCE (T=4 Frames)
# ==============================================================================
draw_box(ax, 3, 76, 12, 10, "Input Video Sequence", "Frames [I_{t-3}, ..., I_t]\nShape: [B, T=4, 3, H, W]",
         bg_col="#F1F5F9", border_col="#64748B", title_size=9, sub_size=7.5)

# Mini frame visualizer stacked
for i, offset in enumerate([(3.8, 77.2), (4.5, 78.0), (5.2, 78.8), (5.9, 79.6)]):
    ax.add_patch(patches.Rectangle(offset, 2.5, 1.8, facecolor='#94A3B8', edgecolor='#334155', lw=0.8, alpha=0.7+i*0.1, zorder=3))
ax.text(9.5, 78.8, "T = 4\nFrames", fontsize=7.5, fontweight='bold', color='#1E293B', zorder=4)

draw_arrow(ax, 16.5, 81, 21, 81, color="#0284C7", lw=2.0, label="Input\nStream", label_pos=(0, 2.2))

# ==============================================================================
# 2. STAGE 1: SHARED LIGHTWEIGHT CSP-DARKNET BACKBONE
# ==============================================================================
# Big Container Box
ax.add_patch(patches.FancyBboxPatch((21.5, 33), 16.5, 56, boxstyle="round,pad=1.0,rounding_size=1.5",
                                    facecolor=COLOR_BACKBONE, edgecolor=COLOR_BACKBONE_BORDER, linewidth=1.5, linestyle='--', zorder=1))
ax.text(29.75, 87.2, "Shared CSP-Darknet Backbone", ha='center', va='center', fontsize=10.5, fontweight='bold', color='#0369A1', zorder=2)
ax.text(29.75, 85.3, "(Extracts multi-scale features)", ha='center', va='center', fontsize=8, color='#0284C7', zorder=2)

draw_box(ax, 23.5, 75, 12.5, 7, "Stem Conv Layer", "Stride 2 (Conv-BN-SiLU)\n[B*T, 32, H/2, W/2]", bg_col="#FFFFFF", border_col=COLOR_BACKBONE_BORDER)
draw_box(ax, 23.5, 61, 12.5, 7, "Stage 1 (C3)", "Stride 2 CSP Block\n[B*T, 64, H/4, W/4]", bg_col="#FFFFFF", border_col=COLOR_BACKBONE_BORDER)
draw_box(ax, 23.5, 47, 12.5, 7, "Stage 2 (C4)", "Stride 2 CSP Block\n[B*T, 128, H/8, W/8]", bg_col="#FFFFFF", border_col=COLOR_BACKBONE_BORDER)
draw_box(ax, 23.5, 35, 12.5, 7, "Stage 3 (C5)", "Stride 2 CSP Block\n[B*T, 256, H/16, W/16]", bg_col="#FFFFFF", border_col=COLOR_BACKBONE_BORDER)

draw_arrow(ax, 29.75, 74, 29.75, 69, color="#0284C7")
draw_arrow(ax, 29.75, 60, 29.75, 55, color="#0284C7")
draw_arrow(ax, 29.75, 46, 29.75, 43, color="#0284C7")

# Connections to FPN
draw_arrow(ax, 37, 64.5, 42.5, 64.5, color="#7C3AED", lw=1.8, label="C3", label_pos=(0, 1.5))
draw_arrow(ax, 37, 50.5, 42.5, 50.5, color="#7C3AED", lw=1.8, label="C4", label_pos=(0, 1.5))
draw_arrow(ax, 37, 38.5, 42.5, 38.5, color="#7C3AED", lw=1.8, label="C5", label_pos=(0, 1.5))

# ==============================================================================
# 3. STAGE 2: FEATURE PYRAMID NETWORK (FPN)
# ==============================================================================
ax.add_patch(patches.FancyBboxPatch((43, 33), 15.5, 56, boxstyle="round,pad=1.0,rounding_size=1.5",
                                    facecolor=COLOR_FPN, edgecolor=COLOR_FPN_BORDER, linewidth=1.5, linestyle='--', zorder=1))
ax.text(50.75, 87.2, "Feature Pyramid Network (FPN)", ha='center', va='center', fontsize=10.5, fontweight='bold', color='#6D28D9', zorder=2)
ax.text(50.75, 85.3, "(Multi-scale semantic fusion)", ha='center', va='center', fontsize=8, color='#7C3AED', zorder=2)

draw_box(ax, 44.5, 61, 12.5, 7, "FPN Level P3", "Lateral C3 + Top-Down P4\n[B, T, 128, H/4, W/4]", bg_col="#FFFFFF", border_col=COLOR_FPN_BORDER)
draw_box(ax, 44.5, 47, 12.5, 7, "FPN Level P4", "Lateral C4 + Top-Down P5\n[B, 128, H/8, W/8]", bg_col="#FFFFFF", border_col=COLOR_FPN_BORDER)
draw_box(ax, 44.5, 35, 12.5, 7, "FPN Level P5", "1x1 Conv from C5\n[B, 128, H/16, W/16]", bg_col="#FFFFFF", border_col=COLOR_FPN_BORDER)

draw_arrow(ax, 50.75, 43, 50.75, 46, color="#7C3AED", label="Upsample", label_pos=(2.2, 0))
draw_arrow(ax, 50.75, 55, 50.75, 60, color="#7C3AED", label="Upsample", label_pos=(2.2, 0))

# ==============================================================================
# 4. STAGE 3: TRANSITION-AWARE TEMPORAL CONVGRU AGGREGATOR
# ==============================================================================
ax.add_patch(patches.FancyBboxPatch((62, 54), 16.5, 35, boxstyle="round,pad=1.0,rounding_size=1.5",
                                    facecolor=COLOR_CONVGRU, edgecolor=COLOR_CONVGRU_BORDER, linewidth=1.8, zorder=1))
ax.text(70.25, 87.2, "Transition-Aware Temporal Aggregator", ha='center', va='center', fontsize=10, fontweight='bold', color='#0F766E', zorder=2)
ax.text(70.25, 85.3, "(ConvGRU Memory + Spatial Gate)", ha='center', va='center', fontsize=7.5, color='#0D9488', zorder=2)

draw_arrow(ax, 58, 64.5, 63.5, 64.5, color="#0D9488", lw=2.0, label="P3 Sequence\n[B, T=4, C, H, W]", label_pos=(0, 2.5))

draw_box(ax, 63.5, 73, 13.5, 9, "ConvGRU Memory Cell", "Hidden State h_t:\nr_t = Sigmoid(Conv([x_t, h_{t-1}]))\nz_t = Sigmoid(Conv([x_t, h_{t-1}]))\nh_t = (1-z)*h_{t-1} + z*tanh(Conv([x_t, r*h]))",
         bg_col="#FFFFFF", border_col=COLOR_CONVGRU_BORDER, title_size=8.5, sub_size=6.8)

draw_box(ax, 63.5, 57, 13.5, 11, "Spatial Attention Gating", "Gate Map: alpha = Sigmoid(Conv([x_t, h_t]))\nFused Feature:\nF_fused = alpha * x_t + (1 - alpha) * h_t\n(Protects against rain spray & glare)",
         bg_col="#FFFFFF", border_col=COLOR_CONVGRU_BORDER, title_size=8.5, sub_size=6.8)

draw_arrow(ax, 70.25, 72, 70.25, 69, color="#0D9488", lw=1.5)

# ==============================================================================
# 5. STAGE 4: MULTI-TASK DECODER HEADS
# ==============================================================================
# Lane Head
draw_box(ax, 82, 77, 15, 8.5, "Lane Detection Head", "2x Bilinear Upsampling + Conv1x1\nOutput: [B, 2, H, W]\n(Background vs Lane Line)",
         bg_col=COLOR_HEAD_LANE, border_col=COLOR_HEAD_LANE_BORDER, title_size=9, sub_size=7.2)

# Drivable Head
draw_box(ax, 82, 60, 15, 8.5, "Drivable Area Head", "2x Bilinear Upsampling + Conv1x1\nOutput: [B, 3, H, W]\n(Background, Direct, Alternate)",
         bg_col=COLOR_HEAD_DRIV, border_col=COLOR_HEAD_DRIV_BORDER, title_size=9, sub_size=7.2)

# Obstacle Head
draw_box(ax, 82, 40, 15, 11, "Obstacle Detection Head", "Anchor-Free Multi-Scale Head\n(P3, P4, P5 multi-level)\nOutput: Classification + Bounding Box (dx, dy, dw, dh)",
         bg_col=COLOR_HEAD_OBJ, border_col=COLOR_HEAD_OBJ_BORDER, title_size=9, sub_size=7.2)

# Arrows to Heads
draw_arrow(ax, 78, 62.5, 81, 81.2, color="#CA8A04", lw=1.8, label="F_fused", label_pos=(-1, 1.2))
draw_arrow(ax, 78, 62.5, 81, 64.2, color="#16A34A", lw=1.8, label="F_fused", label_pos=(-1, 0.8))

# Connections from FPN to Obstacle Head
draw_arrow(ax, 58, 50.5, 81, 46.5, color="#EA580C", lw=1.5, label="P4", label_pos=(0, 1.2))
draw_arrow(ax, 58, 38.5, 81, 42.5, color="#EA580C", lw=1.5, label="P5", label_pos=(0, 1.2))

# ==============================================================================
# 6. STAGE 5: CROSS-TASK CONSISTENCY & REGULARIZATION LOSS
# ==============================================================================
ax.add_patch(patches.FancyBboxPatch((21.5, 6), 75.5, 22, boxstyle="round,pad=1.0,rounding_size=1.5",
                                    facecolor=COLOR_LOSS, edgecolor=COLOR_LOSS_BORDER, linewidth=1.5, zorder=1))
ax.text(59.25, 26.2, "Multi-Task Optimization & Cross-Task Consistency Constraints", ha='center', va='center', fontsize=11, fontweight='bold', color='#9F1239', zorder=2)

draw_box(ax, 23.5, 8.5, 16, 14, "Task-Specific Losses", "Lane: L_lane = Focal + Dice\nDrivable: L_driv = CE + Dice\nObject: L_det = Focal + GIoU",
         bg_col="#FFFFFF", border_col=COLOR_LOSS_BORDER, title_size=9, sub_size=7.5)

draw_box(ax, 43, 8.5, 26, 14, "Cross-Task Consistency Loss (L_CTC)", "L_CTC = (1/|P|) * Sum [ sigma(M_lane) * (1 - Dilate(sigma(M_drivable), k)) ]\nPenalizes physically contradictory predictions\n(Ensures lane lines stay within road corridor)",
         bg_col="#FFFFFF", border_col=COLOR_LOSS_BORDER, title_size=9, sub_size=7.2)

draw_box(ax, 72.5, 8.5, 22.5, 14, "Spatiotemporal Regularizer (L_temp)", "L_temp = (1/|P|) * Sum | sigma(M_t) - sigma(M_{t-1}) |\nSuppresses frame-to-frame mask flickering\nduring abrupt spray / night blooming bursts",
         bg_col="#FFFFFF", border_col=COLOR_LOSS_BORDER, title_size=9, sub_size=7.2)

# Constraint flow arrows from heads to loss
draw_arrow(ax, 89.5, 76, 56, 23.5, color="#E11D48", lw=1.5, style='->')
draw_arrow(ax, 89.5, 59, 56, 23.5, color="#E11D48", lw=1.5, style='->')

# Total Loss Formula Box
ax.add_patch(patches.FancyBboxPatch((3, 9), 16.5, 13.5, boxstyle="round,pad=0.8,rounding_size=1.0",
                                    facecolor="#FFFFFF", edgecolor="#0F172A", linewidth=1.2, zorder=2))
ax.text(11.25, 19.5, "Total Loss Formulation", ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0F172A', zorder=3)
ax.text(11.25, 15.0, r"$L_{total} = \lambda_1 L_{lane} + \lambda_2 L_{driv}$" + "\n" + r"$+ \lambda_3 L_{det} + \lambda_4 L_{CTC} + \lambda_5 L_{temp}$",
        ha='center', va='center', fontsize=7.8, color='#0F172A', zorder=3)

plt.tight_layout()
p_png = os.path.join(OUT_DIR, 'fig0_network_architecture.png')
p_pdf = os.path.join(OUT_DIR, 'fig0_network_architecture.pdf')
plt.savefig(p_png, bbox_inches='tight', dpi=300)
plt.savefig(p_pdf, bbox_inches='tight')
plt.close()

print(f"[OK] Generated Architecture Diagram:\n - PNG: {p_png}\n - PDF: {p_pdf}")
