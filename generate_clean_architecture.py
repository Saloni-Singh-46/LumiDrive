"""
Ultra-Clean, Perfectly Aligned Publication Architecture Diagram for LumiDrive.
Generates:
- results_figures/clean_architecture_diagram.png (300 DPI)
- results_figures/clean_architecture_diagram.pdf (Vector format)
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = 'results_figures'
os.makedirs(OUT_DIR, exist_ok=True)

# Create Wide Clean Figure
fig = plt.figure(figsize=(17, 7.5), dpi=300)
ax = fig.add_subplot(111)
ax.set_xlim(0, 170)
ax.set_ylim(0, 75)
ax.axis('off')
fig.patch.set_facecolor('#FFFFFF')

# Professional Academic Color Palette
C_INPUT = "#F1F5F9"
C_INPUT_BORDER = "#64748B"

C_BB = "#E0F2FE"
C_BB_BORDER = "#0284C7"

C_FPN = "#EDE9FE"
C_FPN_BORDER = "#7C3AED"

C_GRU = "#CCFBF1"
C_GRU_BORDER = "#0D9488"

C_LANE = "#FEF9C3"
C_LANE_BORDER = "#CA8A04"

C_DRIV = "#DCFCE7"
C_DRIV_BORDER = "#16A34A"

C_OBJ = "#FFEDD5"
C_OBJ_BORDER = "#EA580C"

C_LOSS = "#FFE4E6"
C_LOSS_BORDER = "#E11D48"

# Helper function: Draw clean rectangular block
def draw_block(x, y, w, h, title, sub="", bg="#FFFFFF", border="#334155", lw=1.5, r=1.0, title_sz=9.5, sub_sz=7.5, title_color="#0F172A"):
    # Drop shadow
    shadow = patches.FancyBboxPatch((x + 0.4, y - 0.4), w, h, boxstyle=f"round,pad={r},rounding_size={r}",
                                   facecolor="#E2E8F0", edgecolor="none", alpha=0.5, zorder=1)
    ax.add_patch(shadow)
    # Main Box
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad={r},rounding_size={r}",
                                 facecolor=bg, edgecolor=border, linewidth=lw, zorder=2)
    ax.add_patch(box)
    
    if sub:
        ax.text(x + w/2, y + h/2 + 1.2, title, ha='center', va='center', fontsize=title_sz, fontweight='bold', color=title_color, zorder=3)
        ax.text(x + w/2, y + h/2 - 1.5, sub, ha='center', va='center', fontsize=sub_sz, color='#475569', zorder=3)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=title_sz, fontweight='bold', color=title_color, zorder=3)

# Helper function: Draw straight clean connecting arrow
def draw_arrow(x1, y1, x2, y2, color="#475569", lw=1.6, label="", label_pos=(0, 0)):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=lw, shrinkA=2, shrinkB=2), zorder=4)
    if label:
        ax.text((x1 + x2)/2 + label_pos[0], (y1 + y2)/2 + label_pos[1], label,
                ha='center', va='center', fontsize=7.5, fontweight='bold', color=color,
                bbox=dict(boxstyle="square,pad=0.2", fc="#FFFFFF", ec="none", alpha=0.9), zorder=5)

# ==============================================================================
# 0. HEADER TITLE & SUBTITLE
# ==============================================================================
ax.text(85, 71, "LumiDrive: Spatiotemporal Multi-Task Road Perception Network",
        ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A')
ax.text(85, 68, "System Architecture: Shared Backbone -> FPN -> ConvGRU Temporal Aggregator -> Multi-Task Decoders",
        ha='center', va='center', fontsize=9.5, color='#64748B')

# ==============================================================================
# STAGE 1: INPUT STREAM (Col 1: x = 6 to 22)
# ==============================================================================
ax.text(14, 62, "1. Input Stream", ha='center', fontsize=10, fontweight='bold', color='#334155')
draw_block(6, 42, 16, 16, "Video Sequence", "[B, T=4, 3, H, W]\n(Frames $I_{t-3} ... I_t$)",
           bg=C_INPUT, border=C_INPUT_BORDER, lw=1.6)

# Draw mini frame deck
for i in range(3):
    ax.add_patch(patches.Rectangle((7 + i*1.2, 43.5 + i*1.0), 3.5, 2.5, facecolor="#CBD5E1", edgecolor="#475569", lw=0.8, zorder=3))

draw_arrow(23, 50, 31, 50, color="#0284C7", lw=1.8, label="[B*T, 3, H, W]", label_pos=(0, 2.2))

# ==============================================================================
# STAGE 2: SHARED BACKBONE (Col 2: x = 32 to 54)
# ==============================================================================
ax.text(43, 62, "2. CSP-Darknet Backbone", ha='center', fontsize=10, fontweight='bold', color='#0369A1')

# Container boundary
ax.add_patch(patches.FancyBboxPatch((31.5, 14), 23, 45, boxstyle="round,pad=0.8,rounding_size=1.2",
                                    facecolor=C_BB, edgecolor=C_BB_BORDER, lw=1.2, linestyle='--', alpha=0.6, zorder=1))

draw_block(33.5, 48, 19, 8.5, "Stage 1 (C3)", "Stride 4 | [B*T, 64, H/4, W/4]", bg="#FFFFFF", border=C_BB_BORDER)
draw_block(33.5, 33, 19, 8.5, "Stage 2 (C4)", "Stride 8 | [B*T, 128, H/8, W/8]", bg="#FFFFFF", border=C_BB_BORDER)
draw_block(33.5, 18, 19, 8.5, "Stage 3 (C5)", "Stride 16 | [B*T, 256, H/16, W/16]", bg="#FFFFFF", border=C_BB_BORDER)

draw_arrow(43, 47, 43, 42.5, color="#0284C7", lw=1.4)
draw_arrow(43, 32, 43, 27.5, color="#0284C7", lw=1.4)

# Connections to FPN
draw_arrow(53.5, 52.2, 63.5, 52.2, color="#7C3AED", lw=1.6, label="C3", label_pos=(0, 1.5))
draw_arrow(53.5, 37.2, 63.5, 37.2, color="#7C3AED", lw=1.6, label="C4", label_pos=(0, 1.5))
draw_arrow(53.5, 22.2, 63.5, 22.2, color="#7C3AED", lw=1.6, label="C5", label_pos=(0, 1.5))

# ==============================================================================
# STAGE 3: FEATURE PYRAMID NETWORK (Col 3: x = 64 to 86)
# ==============================================================================
ax.text(75, 62, "3. Feature Pyramid (FPN)", ha='center', fontsize=10, fontweight='bold', color='#6D28D9')

ax.add_patch(patches.FancyBboxPatch((63.5, 14), 23, 45, boxstyle="round,pad=0.8,rounding_size=1.2",
                                    facecolor=C_FPN, edgecolor=C_FPN_BORDER, lw=1.2, linestyle='--', alpha=0.6, zorder=1))

draw_block(65.5, 48, 19, 8.5, "FPN Level P3", "Lateral + Top-down | [128, H/4, W/4]", bg="#FFFFFF", border=C_FPN_BORDER)
draw_block(65.5, 33, 19, 8.5, "FPN Level P4", "Lateral + Top-down | [128, H/8, W/8]", bg="#FFFFFF", border=C_FPN_BORDER)
draw_block(65.5, 18, 19, 8.5, "FPN Level P5", "1x1 Conv from C5 | [128, H/16, W/16]", bg="#FFFFFF", border=C_FPN_BORDER)

# Top-down FPN connections
draw_arrow(75, 27.5, 75, 32, color="#7C3AED", lw=1.4, label="2x Up", label_pos=(2.2, 0))
draw_arrow(75, 42.5, 75, 47, color="#7C3AED", lw=1.4, label="2x Up", label_pos=(2.2, 0))

# ==============================================================================
# STAGE 4: TEMPORAL CONVGRU AGGREGATOR (Col 4: x = 96 to 120)
# ==============================================================================
ax.text(108, 62, "4. Temporal Aggregator", ha='center', fontsize=10, fontweight='bold', color='#0F766E')

draw_arrow(85.5, 52.2, 95.5, 52.2, color="#0D9488", lw=1.8, label="P3 Sequence", label_pos=(0, 2.0))

ax.add_patch(patches.FancyBboxPatch((95.5, 30), 25, 29, boxstyle="round,pad=0.8,rounding_size=1.2",
                                    facecolor=C_GRU, edgecolor=C_GRU_BORDER, lw=1.6, zorder=1))

draw_block(97.5, 47, 21, 9.5, "ConvGRU Memory Cell", "Hidden State Update:\n$h_t = (1-z_t)h_{t-1} + z_t\\tilde{h}_t$",
           bg="#FFFFFF", border=C_GRU_BORDER, title_sz=9, sub_sz=7.2)

draw_block(97.5, 33, 21, 9.5, "Spatial Attention Gate", "Fused Feature Output:\n$F_{fused} = \\alpha x_t + (1-\\alpha) h_t$",
           bg="#FFFFFF", border=C_GRU_BORDER, title_sz=9, sub_sz=7.2)

draw_arrow(108, 46, 108, 43.5, color="#0D9488", lw=1.4)

# ==============================================================================
# STAGE 5: MULTI-TASK DECODER HEADS (Col 5: x = 130 to 164)
# ==============================================================================
ax.text(147, 62, "5. Multi-Task Heads & Loss", ha='center', fontsize=10, fontweight='bold', color='#0F172A')

# Lane Head
draw_block(130, 48, 34, 8.5, "Lane Line Segmentation Head", "Bilinear Upsample (4x) -> Conv1x1\nOutput: Binary Lane Mask [B, 2, H, W]",
           bg=C_LANE, border=C_LANE_BORDER, title_sz=9, sub_sz=7.2)

# Drivable Head
draw_block(130, 33, 34, 8.5, "Drivable Free-Space Head", "Bilinear Upsample (4x) -> Conv1x1\nOutput: 3-Class Road Area [B, 3, H, W]",
           bg=C_DRIV, border=C_DRIV_BORDER, title_sz=9, sub_sz=7.2)

# Obstacle Head
draw_block(130, 18, 34, 8.5, "Obstacle Detection Head", "Anchor-Free Multi-Scale Head (P3, P4, P5)\nOutput: BBoxes (dx, dy, dw, dh) + Classes",
           bg=C_OBJ, border=C_OBJ_BORDER, title_sz=9, sub_sz=7.2)

# Routing arrows from ConvGRU to Heads
draw_arrow(121.5, 41, 129, 52.2, color="#CA8A04", lw=1.6)
draw_arrow(121.5, 37, 129, 37.2, color="#16A34A", lw=1.6)

# Route from FPN to Obstacle
draw_arrow(85.5, 22.2, 129, 22.2, color="#EA580C", lw=1.5, label="P5/P4", label_pos=(-8, 1.5))

# ==============================================================================
# BOTTOM: CROSS-TASK CONSISTENCY CONSTRAINT (L_CTC)
# ==============================================================================
ax.add_patch(patches.FancyBboxPatch((95.5, 4), 68.5, 9.5, boxstyle="round,pad=0.6,rounding_size=1.0",
                                    facecolor=C_LOSS, edgecolor=C_LOSS_BORDER, lw=1.4, zorder=1))

ax.text(130, 10.5, "Cross-Task Consistency Regularization Loss (L_CTC)", ha='center', va='center',
        fontsize=9, fontweight='bold', color='#9F1239', zorder=2)
ax.text(130, 6.5, r"$\mathcal{L}_{CTC} = \frac{1}{|P|} \sum \sigma(\hat{M}_{lane}) \cdot [1 - \text{Dilate}(\sigma(\hat{M}_{drivable}))]$" + "  (Enforces physical spatial corridor alignment)",
        ha='center', va='center', fontsize=8, color='#881337', zorder=2)

# Dotted feedback arrows into L_CTC
draw_arrow(147, 47, 147, 14.5, color="#E11D48", lw=1.3)
draw_arrow(147, 32, 147, 14.5, color="#E11D48", lw=1.3)

plt.tight_layout()
p_png = os.path.join(OUT_DIR, 'clean_architecture_diagram.png')
p_pdf = os.path.join(OUT_DIR, 'clean_architecture_diagram.pdf')
plt.savefig(p_png, bbox_inches='tight', dpi=300)
plt.savefig(p_pdf, bbox_inches='tight')
plt.close()

print(f"[OK] Generated Clean Architecture Diagram:\n - PNG: {p_png}\n - PDF: {p_pdf}")
