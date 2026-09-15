# Genuine Data Setup

The repository does not include third-party datasets. Downloading and redistributing CULane is restricted by its academic/non-commercial license and the official download is large.

## CULane

1. Open the official project page: <https://xingangpan.github.io/projects/CULane.html>.
2. Download the training/validation image archives, `laneseg_label_w16.tar.gz`, and `list.tar.gz`.
3. Extract them into one directory, for example:

```text
D:/datasets/culane/
  driver_23_30frame/
  driver_161_90frame/
  laneseg_label_w16/
  list/
    train_gt.txt
    val_gt.txt
```

4. Validate the download from `python_pipeline`:

```powershell
python data/prepare_culane.py --data-root D:/datasets/culane --seq-len 4
```

The adapter in `culane_dataset.py` loads genuine CULane lane masks and contiguous temporal windows. CULane does **not** provide drivable-area ground truth, so the adapter returns a geometric drivable proxy and marks it with `drivable_is_proxy=True`. Do not report that proxy as genuine drivable-area accuracy. Use a dataset with drivable masks, such as BDD100K, for that task.

Do not commit the downloaded archives or extracted images to this repository.

## Mixed training from all provided sources

The training entry point accepts multiple local roots. The two BDD100K links are
alternate Kaggle distributions of the same benchmark, so keep their roots
separate only when they contain non-overlapping files; otherwise use one root to
avoid duplicate samples.

```powershell
cd python_pipeline
..\.venv\Scripts\python.exe train.py --dataset mixed `
  --bdd-root D:/datasets/bdd100k_solesensei `
  --bdd-root D:/datasets/bdd100k_marquis03 `
  --data-root D:/datasets/culane `
  --shift-root D:/datasets/shift `
  --drive-root D:/datasets/shared_drive `
  --device cuda --epochs 30 --batch-size 8
```

`--bdd-root` sources train genuine lane/drivable labels when the extracted
package contains those masks. CULane contributes genuine lane supervision but
its geometric drivable proxy is excluded from the loss. SHIFT and the shared
Drive folder are recursively loaded as unlabeled domain-shift images; they are
included for temporal/domain exposure, but the pipeline never turns missing
annotations into fake segmentation targets. The folders must be downloaded and
extracted locally first; this repository does not have access to Kaggle or
Google Drive credentials.
