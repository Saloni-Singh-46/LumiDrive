export interface PaperSummary {
  id: string;
  title: string;
  shortTitle: string;
  authors: string;
  venue: string;
  year: number;
  doi?: string;
  url?: string;
  coreProblem: string;
  mainContribution: string;
  noveltyScore: string;
  keyTechniques: string[];
  strengths: string[];
  limitations: string[];
  integrationInOurSystem: string;
}

export const RESEARCH_PAPERS: PaperSummary[] = [
  {
    id: 'sang-norris-2025',
    title: 'Improved Generalizability of CNN Based Lane Detection in Challenging Weather Using Adaptive Preprocessing Parameter Tuning',
    shortTitle: 'Adaptive Fuzzy Preprocessing',
    authors: 'Sang & Norris',
    venue: 'IEEE Transactions on Intelligent Vehicles (T-IV)',
    year: 2025,
    coreProblem: 'Standard CNN lane detection dramatically degrades under heavy rain, fog, and night dazzle due to poor contrast and rain streaks.',
    mainContribution: 'Adaptive input-level preprocessing that uses fuzzy logic to automatically tune Canny edge thresholds based on detected-line feedback prior to deep feature extraction.',
    noveltyScore: 'Input-Level Adaptation',
    keyTechniques: [
      'Histogram equalization & illumination normalization',
      'Fuzzy logic parameter controller for Canny thresholding',
      'Feedback loop from previous-frame detection density',
      'Pre-CNN noise reduction without retraining backbone'
    ],
    strengths: [
      'Zero model architecture modification required',
      'Significantly boosts weak marking edges in rain & spray',
      'Computationally lightweight (~1.5ms per frame)'
    ],
    limitations: [
      'Cannot recover completely occluded markings',
      'No temporal memory for sequence continuity',
      'Susceptible to sharp specular puddle reflections'
    ],
    integrationInOurSystem: 'Implemented as Stage 1 Adaptive Preprocessing: normalizes weather degraded camera frames before feeding into the feature encoder.'
  },
  {
    id: 'dai-clrnet-2025',
    title: 'Enhanced Cross Layer Refinement Network for Robust Lane Detection Across Diverse Lighting and Road Conditions',
    shortTitle: 'Enhanced CLRNet (GFO + ALGA)',
    authors: 'Dai et al.',
    venue: 'Computer Vision and Image Understanding (CVIU)',
    year: 2025,
    coreProblem: 'Standard CLRNet treats all spatial regions equally, diluting lane feature attention under shadows, tree canopies, and broken markings.',
    mainContribution: 'Introduces Global Feature Optimization (GFO) and Adaptive Local-Global Aggregation (ALGA) to focus on lane-relevant geometric structures.',
    noveltyScore: 'Feature Refinement Level',
    keyTechniques: [
      'Global Feature Optimization (GFO) lane region gating',
      'Adaptive Local-Global Aggregation (ALGA) geometry encoder',
      'Multi-scale FPN refinement with dynamic anchor priors',
      'Lane curvature attention mechanism'
    ],
    strengths: [
      '+5.4% F1 gain on curved and shadowed highway benchmarks',
      'Preserves lane curvature topology accurately',
      'Reduces false positive detections from road cracks'
    ],
    limitations: [
      'Increases feature pyramid latency slightly (+2.2ms)',
      'Still evaluates frames independently without time memory',
      'No explicit drivable area co-reasoning'
    ],
    integrationInOurSystem: 'Used as the core feature refinement backbone inside our shared multi-task encoder.'
  },
  {
    id: 'liu-cccnet-2025',
    title: 'CCCNet: Criss-Cross Attention Enhanced Cross Layer Refinement Network for Lane Detection in Complex Scenarios',
    shortTitle: 'CCCNet (Criss-Cross Attention)',
    authors: 'Liu, Sun & Chen',
    venue: 'PLOS ONE / IEEE Access',
    year: 2025,
    doi: '10.1371/journal.pone.0315482',
    coreProblem: 'Standard convolutional FPNs lack global receptive field context to infer missing lane sections when lines are occluded by vehicles.',
    mainContribution: 'Embeds Recurrent Criss-Cross Attention (CCA) modules into the CLRNet FPN, enabling each pixel to aggregate context across horizontal and vertical axes.',
    noveltyScore: 'Global Context Level',
    keyTechniques: [
      'Recurrent Criss-Cross Attention (2x iterations for full receptive field)',
      'Cross-pathway spatial context fusion',
      'Long-range lane trajectory continuity extrapolation',
      'Memory-efficient contextual attention ($O(N \\sqrt{N})$ vs $O(N^2)$)'
    ],
    strengths: [
      'Recovers long-range missing segments (+11.2% in no-line cases)',
      'Computationally much lighter than standard full Non-Local blocks',
      'High accuracy on complex multi-lane urban intersections'
    ],
    limitations: [
      'Adds tensor computation overhead on embedded devices',
      'Single-frame context only; cannot remember past video frames'
    ],
    integrationInOurSystem: 'Integrated into the deep feature pyramid stage to capture scene-wide perspective and vanish point alignment.'
  },
  {
    id: 'chae-uda-2025',
    title: 'Context-Aware Sim-to-Real Unsupervised Domain Adaptation for Lane Detection via Disentangled Feature Alignment',
    shortTitle: 'Sim-to-Real Disentangled UDA',
    authors: 'Chae et al.',
    venue: 'IEEE Transactions on Automation Science and Engineering (T-ASE)',
    year: 2025,
    doi: '10.1109/TASE.2025.3371904',
    coreProblem: 'Models trained on synthetic simulators (CARLA) or clean benchmarks (CULane) experience severe domain shift when deployed in unconstrained real-world environments.',
    mainContribution: 'Disentangles lane structural features from background/weather appearance features, performing selective adversarial alignment only on lane geometry while preserving weather robustness.',
    noveltyScore: 'Domain Adaptation Level',
    keyTechniques: [
      'Disentangled lane vs background latent feature space',
      'Selective domain discriminator with gradient reversal (GRL)',
      'Masked contextual consistency regularization',
      'Sim-to-real transfer without target domain labels'
    ],
    strengths: [
      '+14.6% mIoU transfer from synthetic CARLA to adverse real datasets',
      'Mitigates negative transfer common in naive domain adaptation',
      'Enables training with zero manual target annotations'
    ],
    limitations: [
      'Multi-stage adversarial training requires careful hyperparameter tuning',
      'Focuses on cross-domain shift rather than intra-video temporal flicker'
    ],
    integrationInOurSystem: 'Serves as our cross-domain generalization extension for deploying to unstructured roads (IDD-AW).'
  }
];

export const PROPOSED_FRAMEWORK_SYNTHESIS = {
  title: 'Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather',
  authors: 'LumiDrive / RoadSight Research Team',
  venue: 'Conference on Computer Vision and Pattern Recognition (CVPR) / IEEE Intelligent Vehicles Symposium (IV)',
  year: 2026,
  abstract: `Autonomous perception in adverse weather requires more than individual task accuracy; it demands spatiotemporal stability and semantic consistency across tasks during rapid weather transitions. We present LumiDrive/RoadSight, a unified multi-task perception framework that combines (1) Adaptive Fuzzy Preprocessing, (2) Geometry-Guided Feature Refinement with Criss-Cross Attention, (3) ConvGRU Spatiotemporal Video Memory, and (4) a novel Transition-Aware Cross-Task Consistency Objective. Our framework explicitly penalizes spatial disagreements between lane boundaries and drivable area masks while mitigating temporal flicker during sudden precipitation, glare, and fog transitions. Evaluated across CULane, VIL-100, BDD100K, and IDD-AW, our model achieves 89.4% F1 and 87.8% drivable IoU while reducing temporal flicker by 78.5% and maintaining real-time inference at 58.2 FPS on an RTX 4090.`,
  researchGapsAddressed: [
    {
      gap: 'Weather Transition Inconsistency',
      solution: 'Transition-Aware Loss: Penalizes asynchronous task degradation where lane predictions drop while drivable masks lag.'
    },
    {
      gap: 'Single-Frame Temporal Loss',
      solution: 'ConvGRU Spatial Memory: Carries hidden lane representations across $T=3..5$ frames to bridge momentary occlusions and splash blinding.'
    },
    {
      gap: 'Cross-Task Semantic Contradiction',
      solution: 'Drivable-Lane Consistency Objective: Mathematically forces detected lane corridors to bound the drivable free-space polygon.'
    },
    {
      gap: 'Uncalibrated Overconfidence',
      solution: 'Multi-Signal Reliability Head: Calibrates confidence from visual evidence, temporal agreement, and geometric curvature continuity.'
    }
  ],
  lossFormulation: [
    {
      name: 'Total Multi-Task Objective',
      formula: 'L_{total} = L_{seg} + \\lambda_c L_{continuity} + \\lambda_t L_{temporal} + \\lambda_{cons} L_{cross\\_task}',
      description: 'Unified loss balancing per-task accuracy, geometric continuity, temporal smoothness, and cross-task spatial containment.'
    },
    {
      name: 'Cross-Task Containment Loss',
      formula: 'L_{cross\\_task} = \\frac{1}{N} \\sum_{p \\in \\mathcal{P}_{lane}} \\max(0, 1 - M_{drivable}(p))',
      description: 'Penalizes lane boundary pixels that fall outside or contradict the estimated drivable area hull.'
    },
    {
      name: 'Temporal Consistency Loss',
      formula: 'L_{temporal} = \\| \\hat{M}_{lane}^{(t)} - \\mathcal{W}(M_{lane}^{(t-1)}, v_{ego}) \\|_2^2',
      description: 'Encourages frame-to-frame mask stability after warping by ego-vehicle odometry / optical flow.'
    }
  ]
};
