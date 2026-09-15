const fs = require('fs');
const PDFDocument = require('pdfkit');

function generateComprehensivePDF(outputPath) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 45, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
    info: {
      Title: 'LumiDrive / RoadSight: Comprehensive Project Technical & Empirical Specification',
      Author: 'Advanced Research & Autonomous Systems Team',
      Subject: 'Detailed Project Analysis: Data, Architecture, Temporal Mechanism, Loss, and Training Status',
      Keywords: 'Autonomous Driving, Lane Detection, Drivable Area, Multi-Task Perception, ConvGRU, Loss Functions'
    }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Palette constants
  const C_PRIMARY = '#0F2B48';
  const C_SECONDARY = '#0D7685';
  const C_DARK = '#1E293B';
  const C_TEXT = '#334155';
  const C_MUTED = '#64748B';
  const C_LIGHT_BG = '#F8FAFC';
  const C_BORDER = '#CBD5E1';
  const C_BOX_BG = '#F0F9FF';
  const C_BOX_BORDER = '#0284C7';
  const C_WARN_BG = '#FFFBEB';
  const C_WARN_BORDER = '#D97706';
  const C_WARN_TEXT = '#92400E';
  const C_CODE_BG = '#F1F5F9';

  // Helper formatting methods
  function drawHeaderBanner() {
    doc.rect(45, 45, 505, 75).fill(C_PRIMARY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(17)
       .text('LumiDrive / RoadSight Perception System', 55, 55, { width: 485, align: 'left' });
    doc.fillColor('#38BDF8').font('Helvetica').fontSize(10)
       .text('Comprehensive Technical Specification & Empirical Audit', 55, 76);
    doc.fillColor('#E2E8F0').font('Helvetica').fontSize(8.5)
       .text('A Deep-Dive into Dataset Pipeline, Input Prep, Architecture, Weather Transition, Losses & Training Verification', 55, 92, { width: 485 });
    doc.y = 135;
  }

  function addSectionHeader(title, num) {
    if (doc.y > 680) doc.addPage();
    doc.moveDown(0.6);
    const y = doc.y;
    doc.rect(45, y, 4, 18).fill(C_SECONDARY);
    doc.fillColor(C_PRIMARY).font('Helvetica-Bold').fontSize(13)
       .text(`${num ? num + '. ' : ''}${title}`, 55, y + 2);
    doc.moveDown(0.4);
    doc.strokeColor(C_BORDER).lineWidth(0.75).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
  }

  function addSubSectionHeader(title) {
    if (doc.y > 700) doc.addPage();
    doc.moveDown(0.4);
    doc.fillColor(C_SECONDARY).font('Helvetica-Bold').fontSize(10.5)
       .text(title, 45);
    doc.moveDown(0.3);
  }

  function addParagraph(text, options = {}) {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(C_TEXT).font('Helvetica').fontSize(9)
       .text(text, { align: 'justify', lineGap: 2.5, width: 505, ...options });
    doc.moveDown(0.35);
  }

  function addBullet(title, text) {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(C_SECONDARY).font('Helvetica-Bold').fontSize(9)
       .text('•  ' + title + ': ', 50, doc.y, { continued: true });
    doc.fillColor(C_TEXT).font('Helvetica').fontSize(9)
       .text(text, { align: 'justify', lineGap: 2, width: 495 });
    doc.moveDown(0.25);
  }

  function addCallout(title, text, type = 'info') {
    if (doc.y > 670) doc.addPage();
    doc.moveDown(0.3);
    const startY = doc.y;
    const bg = type === 'warn' ? C_WARN_BG : C_BOX_BG;
    const border = type === 'warn' ? C_WARN_BORDER : C_BOX_BORDER;
    const tColor = type === 'warn' ? C_WARN_TEXT : C_PRIMARY;
    
    // Measure text height approx
    const textHeight = doc.heightOfString(text, { width: 480, fontSize: 8.5, lineGap: 2 }) + 22;
    doc.rect(45, startY, 505, textHeight).fillAndStroke(bg, border);
    doc.fillColor(tColor).font('Helvetica-Bold').fontSize(9)
       .text(title, 55, startY + 6);
    doc.fillColor(C_DARK).font('Helvetica').fontSize(8.5)
       .text(text, 55, startY + 19, { width: 485, lineGap: 2 });
    doc.y = startY + textHeight + 6;
  }

  function addCodeBlock(codeText, title = '') {
    if (doc.y > 650) doc.addPage();
    doc.moveDown(0.3);
    const startY = doc.y;
    const textHeight = doc.heightOfString(codeText, { width: 485, fontSize: 7.8, lineGap: 1.5 }) + (title ? 20 : 12);
    
    // Check page overflow
    if (startY + textHeight > 750) {
      doc.addPage();
      return addCodeBlock(codeText, title);
    }

    doc.rect(45, startY, 505, textHeight).fillAndStroke(C_CODE_BG, C_BORDER);
    if (title) {
      doc.fillColor(C_PRIMARY).font('Helvetica-Bold').fontSize(8)
         .text(title, 53, startY + 5);
      doc.strokeColor(C_BORDER).lineWidth(0.5).moveTo(45, startY + 16).lineTo(550, startY + 16).stroke();
      doc.fillColor(C_DARK).font('Courier').fontSize(7.8)
         .text(codeText, 53, startY + 20, { width: 485, lineGap: 1.5 });
    } else {
      doc.fillColor(C_DARK).font('Courier').fontSize(7.8)
         .text(codeText, 53, startY + 6, { width: 485, lineGap: 1.5 });
    }
    doc.y = startY + textHeight + 6;
  }

  function addTable(headers, rows, colWidths) {
    if (doc.y > 650) doc.addPage();
    doc.moveDown(0.3);
    let startY = doc.y;
    const tableWidth = 505;
    const rowHeight = 18;

    // Header row
    doc.rect(45, startY, tableWidth, rowHeight).fill(C_PRIMARY);
    let curX = 45;
    for (let i = 0; i < headers.length; i++) {
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
         .text(headers[i], curX + 4, startY + 4, { width: colWidths[i] - 8, align: 'left' });
      curX += colWidths[i];
    }
    startY += rowHeight;

    // Data rows
    for (let r = 0; r < rows.length; r++) {
      if (startY > 740) {
        doc.addPage();
        startY = 45;
      }
      const isEven = r % 2 === 0;
      doc.rect(45, startY, tableWidth, rowHeight).fill(isEven ? '#FFFFFF' : '#F8FAFC');
      doc.rect(45, startY, tableWidth, rowHeight).stroke(C_BORDER);
      
      let rX = 45;
      for (let c = 0; c < rows[r].length; c++) {
        doc.fillColor(C_DARK).font('Helvetica').fontSize(8)
           .text(rows[r][c], rX + 4, startY + 4, { width: colWidths[c] - 8, align: 'left' });
        rX += colWidths[c];
      }
      startY += rowHeight;
    }
    doc.y = startY + 6;
  }

  // ===================== BUILD DOCUMENT =====================

  // Page 1: Header + Executive Summary + Section 1 (Data)
  drawHeaderBanner();

  addCallout(
    'CRITICAL EXECUTIVE AUDIT SUMMARY (GROUND TRUTH)',
    '1. Datasets: Synthetic procedurally generated sequence dataset (160 train, 40 val, 50 test samples; 640x360, T=4) + CULane real-data adapter (genuine lane masks, geometric proxy for drivable area). Real CULane archives are not bundled.\n' +
    '2. Input Prep: Image size 640x360, T=4 frames sequence [B, T, 3, 360, 640], normalized to [0,1], weather augmentor (rain streaks, Koschmieder fog, headlight glare, clear-to-rain transitions).\n' +
    '3. Architecture: CSP-Darknet Backbone (C3,C4,C5) + 3-scale FPN (P3,P4,P5 at 128ch) + ConvGRU at P3 + Spatial Attention Refinement Gate.\n' +
    '4. Output Heads: Lane Head (2 classes), Drivable Head (3 classes), Object Detection Head (4 classes). ONLY Lane and Drivable heads are trained in python_pipeline/train.py. Object head is defined in code but untaught/unsupervised.\n' +
    '5. Losses: L_total = 1.5*L_lane + 1.0*L_drivable + 0.6*L_ctc + 0.4*L_temp. Dilation size k=5 (11x11 maxpool) for CTC loss. Temporal loss is unaligned pixel L1 difference across frame t and t-1.\n' +
    '6. Training Status: Complete PyTorch training pipeline implemented; NO pre-trained weights (.pth) or training execution logs are present in the repo.'
  );

  addSectionHeader('DATASET SPECIFICATION & SAMPLE PARTITIONING', '1');
  addParagraph(
    'The project repository implements two distinct dataset pipelines: a procedural Synthetic Sequence Dataset (the primary execution path) and a CULane Dataset Adapter designed for genuine academic lane benchmarking.'
  );

  addSubSectionHeader('1.1 Synthetic Road Perception Sequence Dataset (Primary)');
  addParagraph(
    'The synthetic dataset is implemented in python_pipeline/data/dataset.py (RoadPerceptionSequenceDataset). It synthesizes dynamic road curves, asphalt textures, lane markings, drivable free-space corridors, and atmospheric weather perturbations in real-time.'
  );

  addTable(
    ['Split Partition', 'Sample Count', 'Offset Seed', 'Seq Length (T)', 'Weather Conditions Included'],
    [
      ['Training Set', '160 sequences', 'offset = 0', 'T = 4 frames', 'Clear, Rain, Fog, Night Glare, Transition'],
      ['Validation Set', '40 sequences', 'offset = 10,000', 'T = 4 frames', 'Clear, Rain, Fog, Night Glare, Transition'],
      ['Test / Evaluation', '50 sequences', 'offset = 20,000', 'T = 4 frames', 'Clear, Rain, Fog, Night Glare, Transition']
    ],
    [90, 80, 85, 80, 170]
  );

  addBullet('Weather Distribution', 'Samples dynamically cycle through 5 scenarios: [clear, rain, fog, night_glare, transition] using sample_idx % 5.');
  addBullet('Transition Scenario', 'Under the transition condition, frames 0 to (T/2 - 1) are generated as "clear" daylight, while frames T/2 to T-1 dynamically transition to heavy "rain" with water streaks.');
  addBullet('Mask Targets Generated', 'Returns exact binary lane masks (0: Background, 1: Lane) and 3-class drivable masks (0: Background, 1: Direct Ego Lane, 2: Adjacent Alternate Lane).');

  addSubSectionHeader('1.2 CULane Dataset Adapter & Benchmark Integration');
  addParagraph(
    'The CULane sequence loader is implemented in python_pipeline/data/culane_dataset.py (CULaneSequenceDataset). It adapts the official CULane academic dataset (Pan et al., AAAI 2018) into sliding temporal windows.'
  );
  addBullet('Data Storage Policy', 'In strict compliance with academic licensing, no raw CULane image files are committed inside the repo. Users download archives from the official portal and point --data-root to the local directory.');
  addBullet('Temporal Windowing', 'Frames are grouped by parent sequence directory (e.g. driver_23_30frame, driver_161_90frame), sorted chronologically, and sliced into consecutive windows of length T=4 without crossing clip boundaries.');
  addBullet('Drivable Area Geometric Proxy', 'CULane contains ground-truth lane annotations but NO drivable area annotations. The adapter synthesizes a geometric proxy envelope between the leftmost and rightmost lane pixels from the horizon down (tagged drivable_is_proxy=True). This proxy enables loss calculation but must NOT be cited as a genuine drivable benchmark.');

  addSubSectionHeader('1.3 Other Reference Datasets in Research Plan');
  addParagraph(
    'The research documentation (docs/extracted/ and paper/main.tex) outlines long-term validation paths on: (1) VIL-100 (100 video clips, 10,000 frames for video lane tracking), (2) BDD100K (100k driving scenes with simultaneous lane, drivable area, and 2D bounding boxes), (3) IDD / IDD-AW (unstructured Indian roads & adverse weather), and (4) SHIFT (continuous synthetic domain shifts).'
  );

  // ===================== SECTION 2: INPUT PREPARATION =====================
  addSectionHeader('INPUT PREPARATION, NORMALIZATION & AUGMENTATION', '2');
  
  addSubSectionHeader('2.1 Input Geometry & Tensor Shape');
  addBullet('Resolution', 'Standardized to Width = 640 px, Height = 360 px (aspect ratio 16:9). In PyTorch layout: H=360, W=640.');
  addBullet('Sequence Tensor Format', 'Batched multi-frame tensor of shape [B, T, C, H, W] = [B, 4, 3, 360, 640]. For single-frame evaluation: [B, 3, 360, 640].');
  addBullet('Color Space & Normalization', 'Monocular RGB. Raw pixel values [0, 255] uint8 are scaled linearly to [0.0, 1.0] float32 via torch.from_numpy(img).permute(2,0,1).float() / 255.0.');

  addSubSectionHeader('2.2 Adverse Weather Augmentation Pipeline');
  addParagraph(
    'The AdverseWeatherAugmentor class (python_pipeline/data/dataset.py) implements physics-informed environmental perturbations to stress-test temporal resilience:'
  );

  addBullet(
    'Rain Streaks & Splash',
    'Generates num_drops = intensity * 600 line streaks with randomized slant (-8 to +8 px) and drop length (15 to 30 px). Applies cv2.blur(3,3) and alpha-blends the rain mask with factor 0.4 * intensity onto the RGB frame.'
  );
  addBullet(
    'Atmospheric Fog (Koschmieder Model)',
    'Simulates light scattering using I(x) = J(x)*e^(-beta*d) + A*(1 - e^(-beta*d)), with attenuation beta=0.035, linear horizon-to-bonnet depth map d in [1.0, 0.05], and ambient airlight color vector A = [220, 225, 230].'
  );
  addBullet(
    'Night Sensor Blooming & Headlight Glare',
    'Dims ambient illumination by 70% (img * 0.3) and applies a 2D Gaussian exponential glare mask centered at the horizon with radius 90 px, blending warm white glare [255, 250, 235] at 80% strength.'
  );
  addBullet(
    'Dynamic Weather Transitions',
    'Transitions occur within the temporal sliding window: for a 4-frame window under "transition", frames t=0,1 receive clear weather, while frames t=2,3 receive sudden rain degradation.'
  );

  // ===================== SECTION 3: ARCHITECTURE & WEATHER TRANSITION =====================
  addSectionHeader('MODEL ARCHITECTURE & WEATHER TRANSITION MECHANISM', '3');
  
  addSubSectionHeader('3.1 Complete Network Topology & Information Flow');
  addParagraph(
    'The architecture (MultiTaskRoadPerceptionNet) combines a lightweight hierarchical CSP backbone, a top-down Feature Pyramid Network, a spatiotemporal ConvGRU memory unit, and task-specific decoders.'
  );

  addCodeBlock(
`+---------------------------------------------------------------------------------------+
| INPUT: Sequence of T=4 Video Frames [B, T=4, C=3, H=360, W=640]                        |
+---------------------------------------------------------------------------------------+
                                        |
                 [Stage 1 & 2: Stem (Conv 32, Conv 48) - 1/4 Scale]
                                        |
    +-----------------------------------+-----------------------------------+
    | Stage 3 (C3): Conv 64 + CSPBlock(64, 2)  --> [B*T, 64, H/8, W/8]      |
    | Stage 4 (C4): Conv 128 + CSPBlock(128, 3) --> [B*T, 128, H/16, W/16]  |
    | Stage 5 (C5): Conv 256 + CSPBlock(256, 2) --> [B*T, 256, H/32, W/32]  |
    +-----------------------------------+-----------------------------------+
                                        |
           [Feature Pyramid Network (FPN) with Lateral Convs & Smoothing]
                                        |
    +-----------------------------------+-----------------------------------+
    | P3: 1/8 Scale, 128 channels [B, T, 128, 45, 80]                              |
    | P4: 1/16 Scale, 128 channels [B, 128, 22, 40] (Current frame T-1)            |
    | P5: 1/32 Scale, 128 channels [B, 128, 11, 20] (Current frame T-1)            |
    +-----------------------------------+-----------------------------------+
                                        | (P3 Sequence across T=4 frames)
                                        v
     +---------------------------------------------------------------------+
     | TRANSITION-AWARE SPATIOTEMPORAL CONVGRU AGGREGATOR                  |
     |  1. Recurrent ConvGRU: h_t = (1-z)*h_t-1 + z*tanh(Conv([x_t, r*h]))  |
     |  2. Spatial Attention Gate: A = Sigmoid(Conv(ReLU(BN(Conv([x_T, h])))))|
     |  3. Adaptive Memory Fusion: F_fused = A * x_T + (1 - A) * h_T       |
     +---------------------------------------------------------------------+
                                        |
                        Temporally Stabilized P3 Features
                                        |
    +-----------------------------------+-----------------------------------+
    |                                   |                                   |
    v                                   v                                   v
[LANE SEG HEAD]                 [DRIVABLE AREA HEAD]                [OBJECT DETECTION]
Conv 128->64 (Up 2x)            Conv 128->64 (Up 2x)                Anchor-Free Multi-scale
Conv 64->32 (Up Full)           Conv 64->32 (Up Full)               Heads at P3, P4, P5
Conv 32->2 (Logits)             Conv 32->3 (Logits)                 cls (4ch), reg (4ch), obj (1ch)
Output: [B, 2, 360, 640]        Output: [B, 3, 360, 640]            (Defined, not trained)`,
'COMPLETE LUMIDRIVE SPATIOTEMPORAL ARCHITECTURE DIAGRAM'
  );

  addSubSectionHeader('3.2 Exact Weather Transition Mechanism (ConvGRU + Spatial Gating)');
  addParagraph(
    'In single-frame perception, sudden environmental transients (e.g. wiper strokes, water spray, headlight glare) obliterate subtle lane edges, causing abrupt mask dropouts. LumiDrive solves this through a two-tier spatiotemporal mechanism in TransitionAwareTemporalAggregator:'
  );

  addBullet(
    'Step 1: 2D Recurrent ConvGRU Memory Propagation',
    'Propagates a hidden spatial tensor h_t across all T=4 frames in sequence. At each timestep, Reset (r_t) and Update (z_t) gates decide what old information to overwrite and what visual features to retain:\n' +
    '  z_t = Sigmoid(Conv2d([x_t, h_t-1])),   r_t = Sigmoid(Conv2d([x_t, h_t-1]))\n' +
    '  h_tilde = Tanh(Conv2d([x_t, r_t * h_t-1]))\n' +
    '  h_t = (1 - z_t) * h_t-1 + z_t * h_tilde'
  );
  addBullet(
    'Step 2: Weather-Adaptive Spatial Attention Refinement Gate',
    'Instead of simply taking the last hidden state h_T, the module concatenates current instantaneous features x_T with accumulated memory h_T and passes them through a spatial gating network:\n' +
    '  Att_Map = Sigmoid(Conv3x3(ReLU(BN(Conv1x1([x_T, h_T])))))   --> Shape [B, 1, H/8, W/8]\n' +
    '  Fused = Att_Map * x_T + (1.0 - Att_Map) * h_T\n' +
    '  Output = SiLU(BN(Conv3x3(Fused)))'
  );
  addBullet(
    'Physical Operational Rationale',
    'When rain spray or glare corrupts the camera sensor in frame t, the instantaneous signal x_T in that spatial patch is degraded. The learned gate sets Att_Map ~ 0 in the corrupted region, automatically falling back to accumulated temporal memory h_T. When the lens clears, Att_Map ~ 1 restores direct instantaneous sensory input.'
  );

  // ===================== SECTION 4: OUTPUT TARGETS & TASK HEADS =====================
  addSectionHeader('OUTPUT TARGETS & SUPERVISION STATUS', '4');

  addParagraph(
    'A key question is whether the network predicts only lanes and drivable free-space or also vehicle/obstacle detections. Here is the exact status based on the codebase audit:'
  );

  addTable(
    ['Perception Task', 'Output Head Module', 'Channels / Classes', 'Supervised & Trained in train.py?'],
    [
      ['Lane Line Segmentation', 'LaneSegmentationHead', '2 classes (0: Background, 1: Lane)', 'YES (Focal + Dice Loss)'],
      ['Drivable Area Segmentation', 'DrivableAreaHead', '3 classes (0: Bg, 1: Ego, 2: Alt)', 'YES (Cross-Entropy + Dice Loss)'],
      ['Vehicle / Obstacle Detection', 'ObjectDetectionHead', 'P3, P4, P5 (cls: 4, reg: 4, obj: 1)', 'NO (Architectural definition only)']
    ],
    [130, 125, 130, 120]
  );

  addBullet(
    'Lane Segmentation Output',
    'Predicts pixelwise logits [B, 2, H, W]. Class 0 represents background / non-lane road; Class 1 represents painted lane markers (solid, dashed, double lines).'
  );
  addBullet(
    'Drivable Free-Space Output',
    'Predicts pixelwise logits [B, 3, H, W]. Class 0 is non-drivable / background; Class 1 is direct Ego Drivable Lane; Class 2 is Alternate / Adjacent Drivable Lane.'
  );
  addBullet(
    'Object Detection Head Status (IMPORTANT CLARIFICATION)',
    'Object detection heads (ObjectDetectionHead) are instantiated at feature levels P3, P4, P5 in models/multitask_network.py, predicting classification scores (4 classes: car, truck, pedestrian, cyclist), bounding box offsets (dx, dy, dw, dh), and objectness heatmaps.\n' +
    'HOWEVER, in the current training pipeline (train.py), NO bounding box labels exist in the datasets, NO detection loss (e.g. CIoU / Focal BBox Loss) is included in MultiTaskTotalLoss, and NO NMS / bounding box decoder is executed in evaluate.py. Therefore, object detection is NOT trained in this version.'
  );

  // ===================== SECTION 5: LOSS FORMULATION & CODE =====================
  addSectionHeader('LOSS FORMULATIONS, WEIGHTS & REGULARIZERS', '5');

  addParagraph(
    'The objective function (python_pipeline/losses/consistency_loss.py) couples task-specific losses with Cross-Task Consistency and Temporal Smoothness regularizers:'
  );

  addCodeBlock(
`L_total = w_lane * L_lane + w_drivable * L_drivable + w_ctc * L_ctc + w_temp * L_temp

Default Hyperparameter Weights:
  w_lane     = 1.5    (High priority on thin, sparse lane structures)
  w_drivable = 1.0    (Standard cross-entropy + dice weight)
  w_ctc      = 0.6    (Cross-Task Consistency penalty)
  w_temp     = 0.4    (Temporal Flicker regularization)`,
'MULTI-TASK TOTAL LOSS FORMULATION'
  );

  addSubSectionHeader('5.1 Task 1: Lane Segmentation Loss (Focal + Dice)');
  addBullet(
    'Focal Loss',
    'Combines Cross-Entropy with focusing parameter gamma = 2.0 and alpha = 0.25 to prevent overwhelming background dominance over thin lane lines:\n' +
    '  L_focal = - alpha * (1 - p_t)^gamma * log(p_t)'
  );
  addBullet(
    'Soft Dice Loss',
    'Enforces precise boundary overlap on foreground lane class: L_dice = 1.0 - (2 * |P * Y| + 1.0) / (|P| + |Y| + 1.0).'
  );
  addBullet('Composite Lane Loss', 'L_lane = L_focal + L_dice.');

  addSubSectionHeader('5.2 Task 2: Drivable Area Loss (CE + Dice)');
  addBullet('Cross-Entropy Loss', 'Standard multi-class categorical cross-entropy over classes {0: Bg, 1: Ego, 2: Alt}.');
  addBullet('Multi-Class Dice Loss', 'Calculated across all foreground drivable classes (1 and 2).');
  addBullet('Composite Drivable Loss', 'L_drivable = CrossEntropy(logits, targets) + L_dice(logits, targets).');

  addSubSectionHeader('5.3 Task 3: Cross-Task Consistency Loss (L_ctc)');
  addParagraph(
    'The CrossTaskConsistencyLoss module enforces physical spatial rules between lanes and drivable corridors. Lane lines cannot exist floating outside the drivable road boundary.'
  );
  addBullet(
    'Boundary Dilation Mechanism',
    'Uses boundary_dilation = 5. A 2D max-pooling operation with kernel size = 2*dilation + 1 = 11, stride = 1, and padding = 5 expands the drivable envelope by 5 pixels to accommodate outer lane borders:\n' +
    '  Drivable_Envelope = MaxPool2d(Drivable_Prob, kernel_size=11, stride=1, padding=5)'
  );
  addBullet(
    'Inconsistency Penalty Formulation',
    'Multiplies foreground lane probability by the inverted drivable envelope:\n' +
    '  L_ctc = (1 / (H * W)) * sum_{p} [ P_lane(p) * (1.0 - Drivable_Envelope(p)) ]\n' +
    'Penalizes any high lane probability wherever the expanded drivable probability is zero.'
  );

  addSubSectionHeader('5.4 Task 4: Spatiotemporal Flicker Regularization (L_temp)');
  addBullet(
    'Formulation',
    'Calculates the mean absolute difference (L1 norm) between the current frame lane probability mask and the detached previous frame lane prediction:\n' +
    '  L_temp = (1 / (H * W)) * sum_{p} | P_lane,t(p) - P_lane,t-1(p) |'
  );
  addBullet(
    'Temporal Comparison Confirmation',
    'In train.py, the previous frame logits are obtained via outputs["sequence_lane_logits"][:, -2].detach().\n' +
    'CRITICAL LIMITATION: This comparison is UNALIGNED (pixelwise direct subtraction). It does not compute optical flow or ego-motion homography warping. While effective for suppressing instantaneous flicker under high framerates, it treats fast ego-motion displacement as slight loss.'
  );

  // ===================== SECTION 6: TRAINING CONFIG & EMPIRICAL STATUS =====================
  addSectionHeader('TRAINING CONFIGURATION, HARDWARE & EMPIRICAL AUDIT', '6');

  addSubSectionHeader('6.1 Training Hyperparameters & Execution Config');
  addTable(
    ['Hyperparameter', 'Value / Setting in Code', 'Source Script & Line Reference'],
    [
      ['Optimizer', 'AdamW (lr=1e-3, weight_decay=1e-4)', 'python_pipeline/train.py:57'],
      ['LR Schedule', 'CosineAnnealingLR (T_max=epochs, eta_min=1e-6)', 'python_pipeline/train.py:58'],
      ['Default Epochs', '10 (CLI parser) / 15 (function default)', 'python_pipeline/train.py:19, 135'],
      ['Batch Size', '4 sequence batches (drop_last=True for train)', 'python_pipeline/train.py:20, 50'],
      ['Sequence Length (T)', 'T = 4 consecutive temporal frames', 'python_pipeline/train.py:22'],
      ['Mixed Precision', 'torch.cuda.amp.GradScaler + autocast (when CUDA)', 'python_pipeline/train.py:59, 82'],
      ['Device Support', 'Auto / selectable (--device cpu or --device cuda)', 'python_pipeline/train.py:24, 138'],
      ['Validation Freq', 'Every 5 epochs + final epoch', 'python_pipeline/train.py:112'],
      ['Checkpoint Rule', 'Composite score: (Val_Lane_IoU + Val_Driv_mIoU) / 2.0', 'python_pipeline/train.py:119-126']
    ],
    [110, 200, 195]
  );

  addSubSectionHeader('6.2 Random Seed & Reproducibility');
  addBullet(
    'Procedural Dataset Seed',
    'The synthetic dataset uses deterministic index offset seeding: sample_idx = idx + sample_offset with random.Random(sample_idx) in python_pipeline/data/dataset.py:142. This guarantees exact, reproducible road curves, dash positions, and weather perturbations across training (offset 0), val (offset 10,000), and test (offset 20,000).'
  );
  addBullet(
    'PyTorch / CUDA Seeds',
    'Explicit torch.manual_seed() calls are not hardcoded in train.py; users should set torch.manual_seed(42) and np.random.seed(42) prior to official benchmarking runs.'
  );

  addSubSectionHeader('6.3 Empirical Execution Status: Checkpoints & Training Logs');
  addCallout(
    'STATUS OF TRAINING RUNS & CHECKPOINTS (AUDIT FACT CHECK)',
    '1. Have training runs been completed in this workspace?\n' +
    '   --> The repository contains the complete, verified, executable Python training scripts (train.py, evaluate.py, inference_video.py). However, NO pre-trained weights files (weights/*.pth) or training log files (*.log, *.json, *.csv) are saved in the repo.\n\n' +
    '2. Paper Draft Metrics Origin:\n' +
    '   --> The quantitative tables in paper/main.tex (e.g. +16.9% transition F1, CTIR reduction to 4.2%, 39.8 FPS) represent target baseline estimates from the research plan draft. They must not be cited as measured experimental logs until a training run is executed on GPU.',
    'warn'
  );

  addSubSectionHeader('6.4 Quantitative Benchmark & Evaluation Protocol');
  addParagraph(
    'The evaluation suite in python_pipeline/evaluate.py measures 5 core metrics across 6 distinct environmental splits:'
  );

  addTable(
    ['Metric Name', 'Mathematical Definition', 'Target Property Evaluated'],
    [
      ['Lane IoU', 'Intersection(P_lane, Y_lane) / Union(P_lane, Y_lane)', 'Foreground lane marking spatial overlap'],
      ['Lane F1-Score', '2 * TP / (2 * TP + FP + FN)', 'Harmonic balance between precision & recall'],
      ['Drivable mIoU', 'Mean IoU across Background, Ego, and Alt Lane classes', 'Free-space semantic area segmentation'],
      ['CTIR (%)', '|P_lane outside P_drivable| / |Total P_lane| * 100', 'Cross-Task Inconsistency Ratio (spatial conflict)'],
      ['Flicker Index (%)', '|P_lane,t XOR P_lane,t-1| / Total Pixels * 100', 'Temporal mask oscillation across adjacent frames']
    ],
    [95, 230, 180]
  );

  addParagraph(
    'Evaluation splits computed: (1) Overall, (2) Clear Daylight, (3) Heavy Rain, (4) Dense Fog, (5) Night Glare, and (6) Dynamic Weather Transitions.'
  );

  // ===================== SECTION 7: STEP-BY-STEP REPRODUCTION GUIDE =====================
  addSectionHeader('HOW TO TRAIN, EVALUATE & RUN INFERENCE', '7');

  addParagraph('To execute the pipeline directly on a workstation or GPU cluster, use the following commands:');

  addCodeBlock(
`# 1. Activate Environment & Install Dependencies
pip install torch torchvision opencv-python numpy matplotlib

# 2. Train Multi-Task Model on Synthetic Weather Dataset (CPU or CUDA)
python python_pipeline/train.py --epochs 15 --batch-size 4 --lr 1e-3 --device cuda

# 3. Train on CULane Dataset (when external dataset is downloaded)
python python_pipeline/train.py --dataset culane --data-root /path/to/culane --epochs 12 --device cuda

# 4. Evaluate Trained Checkpoint across all 6 Weather Splits
python python_pipeline/evaluate.py --weights weights/best_model.pth --device cuda

# 5. Run Video Inference with Lane/Drivable Overlay and Telemetry Export
python python_pipeline/inference_video.py --weights weights/best_model.pth --video test_road.mp4 --output output_overlay.mp4`,
'COMMAND-LINE WORKFLOW EXECUTION GUIDE'
  );

  // ===================== PAGE NUMBERING & FINALIZE =====================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.strokeColor(C_BORDER).lineWidth(0.5).moveTo(45, 792 - 35).lineTo(550, 792 - 35).stroke();
    doc.fillColor(C_MUTED).font('Helvetica').fontSize(7.5)
       .text('LumiDrive / RoadSight: Comprehensive Project Technical & Empirical Specification', 45, 792 - 28, { align: 'left', width: 350 });
    doc.fillColor(C_MUTED).font('Helvetica-Bold').fontSize(7.5)
       .text(`Page ${i + 1} of ${range.count}`, 450, 792 - 28, { align: 'right', width: 100 });
  }

  doc.end();
  stream.on('finish', () => {
    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated ${outputPath} (${stats.size} bytes, ${range.count} pages)`);
  });
}

const targetPdfPath = 'LumiDrive_Project_Technical_Report.pdf';
generateComprehensivePDF(targetPdfPath);
