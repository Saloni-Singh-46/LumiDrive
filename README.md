# LumiDrive / RoadSight

**Transition-aware multi-task road perception research prototype**

LumiDrive (also presented in the project as **RoadSight**) is a research workspace for robust road-scene understanding under changing visibility. It combines a browser-based research dashboard with a PyTorch video-perception prototype for lane segmentation, drivable-area segmentation, temporal stability, and cross-task consistency.

> **Research status:** This repository contains an implemented prototype and experiment tooling. The frontend includes heuristic and synthetic demonstrations, and the research paper contains draft/target claims. Do not treat dashboard values or unverified manuscript numbers as measured results without reproducing them with saved checkpoints, logs, datasets, and fixed evaluation splits.

## What the project studies

Weather transitions can make lane predictions disappear or flicker while a drivable-area prediction still looks plausible. LumiDrive investigates whether short-term temporal memory and an explicit lane/drivable consistency objective can reduce these contradictory outputs.

The intended input is forward-facing monocular RGB video. The implemented training path focuses on:

- Lane segmentation: background and lane classes.
- Drivable-area segmentation: background, ego-lane, and alternate-drivable classes.
- Temporal aggregation over short frame sequences, with a default sequence length of `T=4`.
- Cross-task consistency: penalizing predicted lane pixels outside the predicted drivable region.
- Temporal flicker measurement and video overlay inference.

The object-detection branch exists architecturally in the model, but object labels, object loss, decoding, and object evaluation are not completed in the current training pipeline.

## Main features

### Interactive React dashboard

The Vite application in `src/` provides a visual research and demonstration environment:

- Analyze Lab with clear, rain, fog, glare, and transition scenarios.
- Lane, drivable-area, vehicle, centerline, heatmap, opacity, and confidence controls.
- Temporal sequence viewer for frame-by-frame behavior.
- Interactive architecture explorer with tensor shapes, equations, and implementation sketches.
- Research papers and literature matrix hub.
- Benchmark and ablation studio.
- Telemetry export, paper reader, LaTeX source, BibTeX, and presentation views.
- Light and dark themes plus LumiDrive/RoadSight branding modes.

The browser dashboard is intentionally separate from the PyTorch model. Its computer-vision engine uses heuristic image analysis and synthetic telemetry for interaction; dashboard benchmark values are not a substitute for Python evaluation.

### PyTorch research pipeline

The implementation under `python_pipeline/` contains:

- A lightweight CSP-style convolutional backbone.
- Three-scale feature pyramid network (FPN).
- ConvGRU temporal aggregation and a spatial temporal gate.
- Lane and drivable-area segmentation heads.
- Consistency and temporal losses.
- Synthetic adverse-weather sequence generation.
- CULane, BDD100K, mixed, and unlabeled domain-sequence adapters.
- Training, evaluation, video inference, and CSV telemetry export.

## Architecture

The current implemented path is:

```text
[B, T, 3, 360, 640]
					|
	 CSP-style backbone
					|
		 FPN: P3 / P4 / P5
					|
			 ConvGRU at P3
					|
	 +------+------+
	 |             |
 Lane head   Drivable head
	2 classes    3 classes
```

The training objective currently combines:

```text
L_total = 1.5 L_lane + 1.0 L_driv + 0.6 L_CTC + 0.4 L_temp
```

Where `L_lane` combines focal and Dice losses, `L_driv` combines cross-entropy and Dice losses, `L_CTC` penalizes lane probability outside a dilated drivable mask, and `L_temp` measures frame-to-frame prediction change. The current temporal comparison is not ego-motion aligned, so flicker values should be interpreted with that limitation in mind.

## Repository layout

```text
.
├── src/                         React dashboard and browser demo
│   ├── App.tsx                  Main application state and views
│   ├── components/              Dashboard panels and modals
│   ├── engine/                  Scenarios, benchmark data, and CV heuristics
│   └── styles/                  Global application styles
├── python_pipeline/             PyTorch training and inference
│   ├── models/                  Backbone, FPN, multi-task net, and ConvGRU
│   ├── losses/                  Consistency and temporal losses
│   ├── data/                    Synthetic and real-data adapters
│   ├── train.py                 Training entry point
│   ├── evaluate.py              Evaluation entry point
│   └── inference_video.py       Video overlays and telemetry
├── paper/                       IEEE-style manuscript and bibliography
├── docs/extracted/              Research gap and implementation notes
├── images/                      Project images and diagrams
├── results_figures/             Generated research figures
├── research_graphs_colab/       Colab research artifacts/checkpoint
├── LumiDrive_Google_Colab_Pipeline.ipynb
├── create_colab_nb.py           Notebook generator
├── generate_*                   Figure, diagram, and PDF generators
├── index.html                   Vite entry HTML
├── package.json                 Frontend dependencies and scripts
└── python_pipeline/requirements.txt
```

## Quick start: frontend dashboard

Requirements: Node.js 18+ and npm.

From the repository root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. The configured development port is `3000`.

Available frontend scripts:

```powershell
npm run dev       # Start the Vite development server
npm run build     # Type-check and create a production build
npm run preview   # Preview the production build locally
```

## Quick start: Python pipeline

Requirements: Python 3.10+ is recommended. A CUDA-enabled PyTorch installation is optional but useful for training. OpenCV and the remaining dependencies are listed in `python_pipeline/requirements.txt`.

Create an environment on Windows:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r python_pipeline\requirements.txt
```

Train on the built-in synthetic sequence dataset:

```powershell
python python_pipeline\train.py --dataset synthetic --epochs 10 --batch-size 4 --device cpu
```

Use `--device cuda` when the installed PyTorch build and GPU support are available. The training script writes checkpoints to its configured output directory, including `best_model.pth` and `latest_checkpoint.pth`.

Evaluate a checkpoint on the synthetic test split:

```powershell
python python_pipeline\evaluate.py --weights path\to\best_model.pth --dataset synthetic --device cpu
```

The evaluator reports lane IoU, lane F1, drivable mIoU, CTIR, and flicker overall and by weather category.

Run video inference:

```powershell
python python_pipeline\inference_video.py `
	--input path\to\input.mp4 `
	--output output_perception.mp4 `
	--weights path\to\best_model.pth `
	--device cpu
```

The output video contains lane and drivable overlays plus an approximate lateral-offset HUD. If enabled by the script, telemetry is exported as CSV. The offset assumes an approximate `3.7 m` lane width and is not calibrated vehicle position.

## Datasets

### Synthetic sequences

`python_pipeline/data/dataset.py` generates `640 x 360` sequences with clear, rain, fog, night-glare, and clear-to-rain transition conditions. The default training configuration uses 160 training samples and 40 validation samples; the evaluation script uses 50 synthetic samples. These samples are useful for checking pipeline behavior, but they cannot establish real-world weather robustness.

### CULane

`python_pipeline/data/culane_dataset.py` loads contiguous CULane frames and genuine lane annotations. Raw CULane data is not bundled and must be downloaded separately according to its terms. CULane does not provide drivable-area labels in this implementation, so the adapter uses a geometric drivable proxy. Do not report that proxy as genuine drivable-area ground truth.

### BDD100K and other sources

The training and evaluation scripts can accept BDD100K roots, mixed datasets, and unlabeled SHIFT/Google Drive image roots. Dataset licenses, directory layouts, sequence splits, and label validity must be checked before an experiment is reported. Split by video, route, or scene before creating temporal windows to avoid leakage.

## Research metrics

- **Lane IoU and F1:** lane segmentation overlap and balance.
- **Drivable mIoU:** mean IoU over the three drivable classes when valid labels are available.
- **CTIR:** percentage of predicted lane pixels outside the predicted drivable region.
- **Flicker:** raw frame-to-frame change in predicted lane masks.
- **Efficiency:** FPS and latency from video inference, with hardware and measurement protocol recorded separately.

Recommended future measurements include motion-compensated temporal stability, precision/recall, calibration/ECE, confidence intervals, parameter count, FLOPs, memory, and repeated random seeds.

## Colab and publication tooling

`LumiDrive_Google_Colab_Pipeline.ipynb` is a GPU-oriented notebook for synthetic data, model construction, evaluation, and publication figure generation. `create_colab_nb.py` can regenerate the notebook.

The root-level JavaScript and Python generators create architecture diagrams, research figures, result figures, and PDF/HTML handbook artifacts. Generated figures and manuscript content should be checked against actual experiment logs before publication.

## Evidence and limitations

The following are important boundaries of the current repository:

- No complete, reproducible real-weather experiment record is guaranteed by the source tree.
- Synthetic weather is not equivalent to real weather.
- The frontend is a heuristic demonstration and is not connected to PyTorch inference.
- The object head is not trained or evaluated.
- Temporal loss and flicker metrics are not currently ego-motion compensated.
- Confidence calibration, lane-geometry fitting, and camera calibration are incomplete.
- The lateral offset is an approximate visualization, not a safety-certified ADAS measurement.
- The manuscript and generated figures contain draft values that must be reproduced or clearly labelled as targets before use in a paper.
- This is a research prototype. It is not autonomous-driving control software and must not be used for vehicle control or safety decisions.

## Suggested experiment sequence

1. Reproduce the synthetic single-frame/temporal baseline and save the environment, seed, configuration, checkpoint, and logs.
2. Validate the evaluation script on named held-out sequences.
3. Add real datasets with verified labels and video-level splits.
4. Compare baseline, ConvGRU-only, consistency-only, temporal-loss-only, and full variants.
5. Report accuracy, CTIR, flicker, worst-condition degradation, calibration, and efficiency together.
6. Update the manuscript only from saved, repeatable experiment artifacts.

## Research documents

- `research_project_handbook.html` and `research_project_handbook.tex`: technical audit, scope, limitations, and publication checklist.
- `paper/main.tex`: current IEEE-style manuscript draft.
- `paper/references.bib`: bibliography.
- `docs/extracted/final_research_gap_and_project_plan.txt`: recommended research gap and experimental direction.
- `docs/extracted/Temporal_Lane_Detection_Project_Report.txt`: temporal lane research report.
- `docs/extracted/Lane_Detection_Prototype_Step_by_Step_Guide.txt`: implementation guide.

## License and data

No repository license is currently declared in the project metadata. Add an explicit license before redistributing the source. External datasets such as CULane and BDD100K are not covered by this repository and remain subject to their own licenses and download terms.

## Citation

The manuscript title currently used by the project is:

> **Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather Conditions**

Please cite the final published work only after the authorship, venue, and experimental results have been finalized.