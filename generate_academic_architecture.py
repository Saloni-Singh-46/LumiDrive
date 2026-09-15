"""
Authentic, Handcrafted-Style IEEE/CVPR Academic Architecture Diagram for LumiDrive.
Built directly with pure Matplotlib vector primitives (looks 100% like draw.io / Illustrator / LaTeX TikZ, zero AI artifacts).
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = 'results_figures'
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Canvas Setup (Wide IEEE 2-Column Banner Style)
fig, ax = plt.subplots(figsize=(16.5, 6.8), dpi=300)
ax.set_xlim(0, 165)
ax.set_ylim(0, 68)
ax.axis('off')
fig.patch.set_facecolor('#FFFFFF')

# Standard Academic Color Palette (CVPR/ICCV style)
C_BOX_BG = "#F8FAFC"
C_BOX_EDGE = "#475569"

C_IN_BG = "#F1F5F9"
C_IN_EDGE = "#334155"

C_BB_BG = "#EFF6FF"
C_BB_EDGE = "#1D4ED8"

C_FPN_BG = "#F5F3FF"
C_FPN_EDGE = "#6D28D9"

C_GRU_BG = "#F0FDFA"
C_GRU_EDGE = "#0F766E"

C_HEAD_BG = "#FEFCE8"
C_HEAD_EDGE = "#B45309"

C_LOSS_BG = "#FFF1F2"
C_LOSS_EDGE = "#BE123C"

# Helper function to draw crisp, hand-drawn vector style rounded boxes
def draw_card(x, y, w, h, title, subtitle="", shape_text="", bg=C_BOX_BG, edge=C_BOX_EDGE, lw=1.4, title_col="#0F172A"):
    # Main crisp box
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5,rounding_size=0.8",
                                 facecolor=bg, edgecolor=edge, linewidth=lw, zorder=2)
    ax.add_patch(box)
    
    # Text rendering
    if subtitle and shape_text:
        ax.text(x + w/2, y + h - 2.2, title, ha='center', va='center', fontsize=9.0, fontweight='bold', color=title_col, zorder=3)
        ax.text(x + w/2, y + h/2 - 0.2, subtitle, ha='center', va='center', fontsize=7.6, color='#334155', zorder=3)
        ax.text(x + w/2, y + 2.0, shape_text, ha='center', va='center', fontsize=7.2, family='monospace', fontweight='semibold', color='#64748B', zorder=3)
    elif subtitle:
        ax.text(x + w/2, y + h/2 + 1.2, title, ha='center', va='center', fontsize=9.0, fontweight='bold', color=title_col, zorder=3)
        ax.text(x + w/2, y + h/2 - 1.4, subtitle, ha='center', va='center', fontsize=7.6, color='#475569', zorder=3)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=9.0, fontweight='bold', color=title_col, zorder=3)

# Helper function to draw crisp orthogonal connecting arrows
def draw_arrow(x1, y1, x2, y2, color="#334155", lw=1.4, label="", label_pos=(0, 0)):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=11), zorder=4)
    if label:
        ax.text((x1 + x2)/2 + label_pos[0], (y1 + y2)/2 + label_pos[1], label,
                ha='center', va='center', fontsize=7.2, fontweight='bold', color=color,
                bbox=dict(boxstyle="square,pad=0.15", fc="#FFFFFF", ec="none", alpha=0.9), zorder=5)

# ==============================================================================
# SECTION HEADERS (5 Clearly Defined Pipeline Columns)
# ==============================================================================
col_x = [14, 42, 72, 103, 142]
headers = [
    "(a) Input Sequence",
    "(b) CSP-Darknet Backbone",
    "(c) Feature Pyramid (FPN)",
    "(d) ConvGRU Aggregator",
    "(e) Multi-Task Decoders"
]
header_colors = [C_IN_EDGE, C_BB_EDGE, C_FPN_EDGE, C_GRU_EDGE, C_HEAD_EDGE]

for cx, h_text, h_col in zip(col_x, headers, header_colors):
    ax.text(cx, 63.5, h_text, ha='center', va='center', fontsize=9.5, fontweight='bold', color=h_col)

# ==============================================================================
# 1. INPUT STREAM (Col 1: x = 5 to 23)
# ==============================================================================
# Stack of 4 frames
for i in range(4):
    f_offset = i * 1.0
    f_box = patches.Rectangle((6 + f_offset, 35 + f_offset), 13, 16,
                              facecolor="#FFFFFF", edgecolor="#64748B", linewidth=1.1, zorder=2+i)
    ax.add_patch(f_box)
    ax.text(12.5 + f_offset, 43 + f_offset, f"Frame $t-{3-i}$", fontsize=7.2, ha='center', color="#475569", zorder=3+i)

ax.text(14, 29, "Input Tensor:\n$[B, T=4, 3, H, W]$", ha='center', va='center',
        fontsize=7.8, family='monospace', fontweight='bold', color='#1E293B',
        bbox=dict(boxstyle="round,pad=0.3", fc=C_IN_BG, ec=C_IN_EDGE, lw=1.0), zorder=5)

draw_arrow(23.5, 45, 30.5, 45, color="#1D4ED8", lw=1.6, label="Batch $B*T$", label_pos=(0, 1.8))

# ==============================================================================
# 2. SHARED CSP-DARKNET BACKBONE (Col 2: x = 31 to 53)
# ==============================================================================
draw_card(31, 48, 22, 10, "Stage 1 ($C_3$)", "Stem + CSP Residual Blocks", "$[B*T, 64, H/4, W/4]$", bg=C_BB_BG, edge=C_BB_EDGE)
draw_card(31, 33, 22, 10, "Stage 2 ($C_4$)", "Cross-Stage Partial Block", "$[B*T, 128, H/8, W/8]$", bg=C_BB_BG, edge=C_BB_EDGE)
draw_card(31, 18, 22, 10, "Stage 3 ($C_5$)", "Cross-Stage Partial Block", "$[B*T, 256, H/16, W/16]$", bg=C_BB_BG, edge=C_BB_EDGE)

# Downsampling arrows
draw_arrow(42, 48, 42, 43, color="#1D4ED8", label="Stride 2", label_pos=(3.0, 0))
draw_arrow(42, 33, 42, 28, color="#1D4ED8", label="Stride 2", label_pos=(3.0, 0))

# Lateral connections to FPN
draw_arrow(53, 53, 61, 53, color="#6D28D9", lw=1.4, label="$C_3$", label_pos=(0, 1.4))
draw_arrow(53, 38, 61, 38, color="#6D28D9", lw=1.4, label="$C_4$", label_pos=(0, 1.4))
draw_arrow(53, 23, 61, 23, color="#6D28D9", lw=1.4, label="$C_5$", label_pos=(0, 1.4))

# ==============================================================================
# 3. FEATURE PYRAMID NETWORK (Col 3: x = 61 to 83)
# ==============================================================================
draw_card(61, 48, 22, 10, "FPN Level $P_3$", "Lateral $C_3$ + Up($P_4$)", "$[B, T, 128, H/4, W/4]$", bg=C_FPN_BG, edge=C_FPN_EDGE)
draw_card(61, 33, 22, 10, "FPN Level $P_4$", "Lateral $C_4$ + Up($P_5$)", "$[B, 128, H/8, W/8]$", bg=C_FPN_BG, edge=C_FPN_EDGE)
draw_card(61, 18, 22, 10, "FPN Level $P_5$", "$1\\times 1$ Conv on $C_5$", "$[B, 128, H/16, W/16]$", bg=C_FPN_BG, edge=C_FPN_EDGE)

# Top-down FPN upsampling
draw_arrow(72, 28, 72, 33, color="#6D28D9", label="2x Up", label_pos=(2.8, 0))
draw_arrow(72, 43, 72, 48, color="#6D28D9", label="2x Up", label_pos=(2.8, 0))

# Connection to ConvGRU
draw_arrow(83, 53, 91.5, 53, color="#0F766E", lw=1.6, label="$P_3(t)$", label_pos=(0, 1.6))

# ==============================================================================
# 4. TEMPORAL CONVGRU AGGREGATOR (Col 4: x = 92 to 114)
# ==============================================================================
# Container box for ConvGRU + Gating
ax.add_patch(patches.FancyBboxPatch((91.5, 27), 23, 31, boxstyle="round,pad=0.6,rounding_size=1.0",
                                    facecolor=C_GRU_BG, edgecolor=C_GRU_EDGE, lw=1.4, zorder=1))

draw_card(93, 44, 20, 12, "ConvGRU Cell", "Recurrent State:\n$\\mathbf{h}_t = (1-z_t)\\mathbf{h}_{t-1} + z_t\\mathbf{\\tilde{h}}_t$",
          bg="#FFFFFF", edge=C_GRU_EDGE, lw=1.1, title_col="#0F766E")

draw_card(93, 29, 20, 12, "Spatial Gating ($\\alpha$)", "Fused Feature Output:\n$\\mathbf{F}_t = \\alpha P_3(t) + (1-\\alpha)\\mathbf{h}_t$",
          bg="#FFFFFF", edge=C_GRU_EDGE, lw=1.1, title_col="#0F766E")

draw_arrow(103, 44, 103, 41, color="#0F766E", lw=1.3)

# ==============================================================================
# 5. MULTI-TASK DECODER HEADS (Col 5: x = 124 to 160)
# ==============================================================================
# Lane Head
draw_card(124, 48, 36, 10, "Lane Segmentation Head", "Conv $3\\times 3$ + Bilinear 4x + Conv $1\\times 1$", "Output: $\\hat{M}_{lane} \\in \\mathbb{R}^{B \\times 2 \\times H \\times W}$",
          bg=C_HEAD_BG, edge=C_HEAD_EDGE, title_col="#92400E")

# Drivable Head
draw_card(124, 33, 36, 10, "Drivable Area Head", "Conv $3\\times 3$ + Bilinear 4x + Conv $1\\times 1$", "Output: $\\hat{M}_{driv} \\in \\mathbb{R}^{B \\times 3 \\times H \\times W}$",
          bg=C_HEAD_BG, edge=C_HEAD_EDGE, title_col="#92400E")

# Obstacle Head
draw_card(124, 18, 36, 10, "Obstacle Detection Head", "Anchor-Free Heads on $P_3, P_4, P_5$", "Output: Classes + Bounding Boxes",
          bg=C_HEAD_BG, edge=C_HEAD_EDGE, title_col="#92400E")

# Routing arrows from ConvGRU to Heads
draw_arrow(114.5, 38, 123.5, 53, color="#0F766E", lw=1.5, label="$\\mathbf{F}_t$", label_pos=(-2, 2.0))
draw_arrow(114.5, 35, 123.5, 38, color="#0F766E", lw=1.5, label="$\\mathbf{F}_t$", label_pos=(-2, 1.2))

# Routing from FPN to Obstacle
draw_arrow(83, 23, 123.5, 23, color="#6D28D9", lw=1.3, label="$P_4, P_5$", label_pos=(-12, 1.5))

# ==============================================================================
# BOTTOM: CROSS-TASK CONSISTENCY CONSTRAINT (L_CTC)
# ==============================================================================
ax.add_patch(patches.FancyBboxPatch((91.5, 3), 68.5, 11, boxstyle="round,pad=0.6,rounding_size=1.0",
                                    facecolor=C_LOSS_BG, edgecolor=C_LOSS_EDGE, lw=1.4, zorder=1))

ax.text(125.75, 11.2, "Cross-Task Consistency Regularization Loss ($\\mathcal{L}_{CTC}$)",
        ha='center', va='center', fontsize=9.0, fontweight='bold', color='#9F1239', zorder=2)
ax.text(125.75, 6.8, r"$\mathcal{L}_{CTC} = \frac{1}{|P|} \sum_{p} \sigma(\hat{M}_{lane}(p)) \cdot \left[1 - \text{Dilate}(\sigma(\hat{M}_{drivable}(p)), k)\right]$" + "\n(Prevents lane predictions outside drivable road boundaries)",
        ha='center', va='center', fontsize=7.5, color='#881337', zorder=2)

# Constraint links
draw_arrow(142, 48, 142, 14, color="#BE123C", lw=1.3)
draw_arrow(142, 33, 142, 14, color="#BE123C", lw=1.3)

plt.tight_layout()
p_png = os.path.join(OUT_DIR, 'academic_architecture_diagram.png')
p_pdf = os.path.join(OUT_DIR, 'academic_architecture_diagram.pdf')
plt.savefig(p_png, bbox_inches='tight', dpi=300)
plt.savefig(p_pdf, bbox_inches='tight')
plt.close()

print(f"[OK] Generated Authentic Academic Architecture Diagram:\n - PNG: {p_png}\n - PDF: {p_pdf}")
