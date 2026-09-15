"""
Classic Standard Research Paper Architecture Diagram for LumiDrive (Clean & Clutter-Free).
Zero overlapping text, zero text over connector lines, perfectly clean IEEE/CVPR style.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = 'results_figures'
os.makedirs(OUT_DIR, exist_ok=True)

# Create figure
fig, ax = plt.subplots(figsize=(15.0, 5.2), dpi=300)
ax.set_xlim(0, 150)
ax.set_ylim(0, 52)
ax.axis('off')
fig.patch.set_facecolor('#FFFFFF')

# Standard academic flat colors
C_BACKBONE = "#E0F2FE"
C_BACKBONE_B = "#0284C7"

C_FPN = "#EDE9FE"
C_FPN_B = "#7C3AED"

C_GRU = "#CCFBF1"
C_GRU_B = "#0D9488"

C_LANE = "#FEF9C3"
C_LANE_B = "#CA8A04"

C_DRIV = "#DCFCE7"
C_DRIV_B = "#16A34A"

C_OBJ = "#FFEDD5"
C_OBJ_B = "#EA580C"

C_LOSS = "#FFE4E6"
C_LOSS_B = "#E11D48"

# 1. Helper: Draw simple flat rectangular block
def draw_rect(x, y, w, h, text_main, text_sub="", bg="#FFFFFF", border="#000000", lw=1.1, main_sz=8.6, sub_sz=7.2):
    rect = patches.Rectangle((x, y), w, h, facecolor=bg, edgecolor=border, linewidth=lw, zorder=2)
    ax.add_patch(rect)
    if text_sub:
        ax.text(x + w/2, y + h/2 + 1.2, text_main, ha='center', va='center', fontsize=main_sz, fontweight='bold', color="#0F172A", zorder=3)
        ax.text(x + w/2, y + h/2 - 1.4, text_sub, ha='center', va='center', fontsize=sub_sz, color="#334155", zorder=3)
    else:
        ax.text(x + w/2, y + h/2, text_main, ha='center', va='center', fontsize=main_sz, fontweight='bold', color="#0F172A", zorder=3)

# 2. Helper: Draw clean arrow
def draw_conn(x1, y1, x2, y2, color="#334155", lw=1.2, label="", label_pos=(0, 0)):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=lw, shrinkA=1, shrinkB=1), zorder=4)
    if label:
        ax.text((x1+x2)/2 + label_pos[0], (y1+y2)/2 + label_pos[1], label,
                ha='center', va='center', fontsize=7.0, fontweight='bold', color=color,
                bbox=dict(boxstyle="square,pad=0.1", fc="#FFFFFF", ec="none", alpha=0.9), zorder=5)

# ==============================================================================
# 1. INPUT VIDEO STREAM (Leftmost)
# ==============================================================================
ax.text(11, 46.5, "Input Frames\n(T=4)", ha='center', va='center', fontsize=8.5, fontweight='bold', color="#1E293B")

frame_labels = [r"$I_{t-3}$", r"$I_{t-2}$", r"$I_{t-1}$", r"$I_t$"]
for i in range(4):
    ax.add_patch(patches.Rectangle((4 + i*1.2, 22 + i*1.2), 11, 15, facecolor="#F1F5F9", edgecolor="#64748B", lw=1.0, zorder=2+i))
    ax.text(9.5 + i*1.2, 29.5 + i*1.2, frame_labels[i], fontsize=7.2, ha='center', color="#475569", zorder=3+i)

ax.text(11, 16.5, "[B, 4, 3, H, W]", ha='center', va='center', fontsize=7.2, family='monospace', color="#475569")
draw_conn(18, 31, 24, 31, color="#0284C7", lw=1.4)

# ==============================================================================
# 2. SHARED BACKBONE (CSP-Darknet)
# ==============================================================================
ax.add_patch(patches.Rectangle((24, 14), 20, 31, facecolor=C_BACKBONE, edgecolor=C_BACKBONE_B, lw=1.1, linestyle='--', zorder=1))
ax.text(34, 42.5, "CSP-Darknet\nBackbone", ha='center', va='center', fontsize=8.5, fontweight='bold', color="#0369A1", zorder=2)

draw_rect(25.5, 32, 17, 6.5, "Stage 1 (C3)", "Stride 4 (1/4)", bg="#FFFFFF", border=C_BACKBONE_B)
draw_rect(25.5, 23.5, 17, 6.5, "Stage 2 (C4)", "Stride 8 (1/8)", bg="#FFFFFF", border=C_BACKBONE_B)
draw_rect(25.5, 15, 17, 6.5, "Stage 3 (C5)", "Stride 16 (1/16)", bg="#FFFFFF", border=C_BACKBONE_B)

draw_conn(34, 32, 34, 30, color="#0284C7")
draw_conn(34, 23.5, 34, 21.5, color="#0284C7")

# Lateral Connections to FPN
draw_conn(42.5, 35.2, 49, 35.2, color="#7C3AED", lw=1.2, label="C3", label_pos=(0, 1.2))
draw_conn(42.5, 26.7, 49, 26.7, color="#7C3AED", lw=1.2, label="C4", label_pos=(0, 1.2))
draw_conn(42.5, 18.2, 49, 18.2, color="#7C3AED", lw=1.2, label="C5", label_pos=(0, 1.2))

# ==============================================================================
# 3. FEATURE PYRAMID NETWORK (FPN)
# ==============================================================================
ax.add_patch(patches.Rectangle((49, 14), 20, 31, facecolor=C_FPN, edgecolor=C_FPN_B, lw=1.1, linestyle='--', zorder=1))
ax.text(59, 42.5, "Feature Pyramid\nNetwork (FPN)", ha='center', va='center', fontsize=8.5, fontweight='bold', color="#6D28D9", zorder=2)

draw_rect(50.5, 32, 17, 6.5, "FPN Level P3", "Channels: 128", bg="#FFFFFF", border=C_FPN_B)
draw_rect(50.5, 23.5, 17, 6.5, "FPN Level P4", "Channels: 128", bg="#FFFFFF", border=C_FPN_B)
draw_rect(50.5, 15, 17, 6.5, "FPN Level P5", "Channels: 128", bg="#FFFFFF", border=C_FPN_B)

draw_conn(59, 21.5, 59, 23.5, color="#7C3AED", lw=1.1, label="2x Up", label_pos=(2.2, 0))
draw_conn(59, 30, 59, 32, color="#7C3AED", lw=1.1, label="2x Up", label_pos=(2.2, 0))

# ==============================================================================
# 4. TEMPORAL CONVGRU AGGREGATOR
# ==============================================================================
draw_conn(67.5, 35.2, 75, 35.2, color="#0D9488", lw=1.4, label="P3 Seq", label_pos=(0, 1.4))

ax.add_patch(patches.Rectangle((75, 21), 22, 24, facecolor=C_GRU, edgecolor=C_GRU_B, lw=1.1, zorder=1))
ax.text(86, 41.5, "Temporal Aggregator\n(ConvGRU + Gate)", ha='center', va='center', fontsize=8.2, fontweight='bold', color="#0F766E", zorder=2)

draw_rect(76.5, 31.5, 19, 7.5, "ConvGRU Memory", r"State: $h_t = f(x_t, h_{t-1})$", bg="#FFFFFF", border=C_GRU_B, main_sz=8.0, sub_sz=6.8)
draw_rect(76.5, 22.5, 19, 7.5, "Spatial Gate", r"Fused: $F_t = \alpha x_t + (1-\alpha)h_t$", bg="#FFFFFF", border=C_GRU_B, main_sz=8.0, sub_sz=6.8)
draw_conn(86, 31.5, 86, 30, color="#0D9488")

# ==============================================================================
# 5. MULTI-TASK DECODER HEADS (Rightmost)
# ==============================================================================
# Lane Head
draw_rect(104, 33, 35, 7.5, "Lane Line Detection Head", "Conv + 4x Bilinear Up -> Binary Lane Mask", bg=C_LANE, border=C_LANE_B, main_sz=8.2, sub_sz=6.8)

# Drivable Head
draw_rect(104, 23, 35, 7.5, "Drivable Free-Space Head", "Conv + 4x Bilinear Up -> 3-Class Road Area", bg=C_DRIV, border=C_DRIV_B, main_sz=8.2, sub_sz=6.8)

# Obstacle Head
draw_rect(104, 13, 35, 7.5, "Obstacle Detection Head", "Anchor-Free Multi-Scale (P3, P4, P5) -> BBoxes", bg=C_OBJ, border=C_OBJ_B, main_sz=8.2, sub_sz=6.8)

# Arrows from ConvGRU to Lane & Drivable Heads
draw_conn(97, 26.5, 104, 36.7, color="#0D9488", lw=1.3, label="F_t", label_pos=(-2, 1.2))
draw_conn(97, 26.5, 104, 26.7, color="#0D9488", lw=1.3, label="F_t", label_pos=(-2, 0.8))

# Arrow from FPN to Obstacle Head
draw_conn(67.5, 18.2, 104, 16.7, color="#7C3AED", lw=1.1, label="P4, P5", label_pos=(-12, 1.2))

# ==============================================================================
# 6. CROSS-TASK CONSISTENCY LOSS (L_CTC) - CLEAN UNCLUTTERED CONNECTOR
# ==============================================================================
ax.add_patch(patches.Rectangle((60, 3), 85, 7.5, facecolor=C_LOSS, edgecolor=C_LOSS_B, lw=1.1, linestyle='--', zorder=1))
ax.text(102.5, 6.8, r"Cross-Task Consistency Loss:  $\mathcal{L}_{CTC} = \frac{1}{|P|} \sum \sigma(\hat{M}_{lane}) \cdot [1 - \text{Dilate}(\sigma(\hat{M}_{drivable}))]$",
        ha='center', va='center', fontsize=7.6, fontweight='bold', color="#9F1239", zorder=2)

# Clean, simple side connector with ZERO text on top of the line
ax.plot([139, 143], [36.7, 36.7], color="#BE123C", lw=1.2, zorder=4)
ax.plot([139, 143], [26.7, 26.7], color="#BE123C", lw=1.2, zorder=4)
ax.plot([143, 143], [36.7, 10.5], color="#BE123C", lw=1.2, zorder=4)
ax.annotate("", xy=(143, 10.5), xytext=(143, 13),
            arrowprops=dict(arrowstyle="->", color="#BE123C", lw=1.2, shrinkA=0, shrinkB=0), zorder=5)

p_png = os.path.join(OUT_DIR, 'classic_paper_architecture.png')
p_pdf = os.path.join(OUT_DIR, 'classic_paper_architecture.pdf')
plt.savefig(p_png, bbox_inches='tight', dpi=300)
plt.savefig(p_pdf, bbox_inches='tight')
plt.close()

print(f"[OK] Generated Clean Architecture Diagram (No Text on Line):\n - PNG: {p_png}\n - PDF: {p_pdf}")
