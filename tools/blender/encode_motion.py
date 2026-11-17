"""Débruiter les images Blender, puis assembler le MP4 muet de prévisualisation.

Le .blend et les PNG bruts restent dans le dossier de travail. L’export utilise
uniquement les images réellement rendues, sans interpolation de mouvement.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import subprocess
import sys
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--oidn", type=Path, required=True)
parser.add_argument("--workers", type=int, default=2)
args = parser.parse_args()
folder = args.output.resolve()
metadata = json.loads((folder / "motion.json").read_text())
frames = metadata["frames"]
clean = folder / "clean"
clean.mkdir(exist_ok=True)
logs = folder / "denoise-logs"
logs.mkdir(exist_ok=True)
missing = [
    frame
    for frame in range(1, frames + 1)
    if not (folder / "raw" / f"frame-{frame:04d}.png").exists()
]
if missing:
    raise SystemExit(f"Images manquantes : {missing}")


def denoise(frame):
    source = folder / "raw" / f"frame-{frame:04d}.png"
    target = clean / source.name
    # Reprise possible après interruption, sans retraiter les images terminées.
    if target.exists() and target.stat().st_mtime > source.stat().st_mtime:
        try:
            with Image.open(target) as cached:
                cached.verify()
            return frame
        except (OSError, SyntaxError):
            pass
    temporary = target.with_name(f".{target.stem}.tmp.png")
    with (logs / f"{frame:04d}.log").open("w") as log:
        subprocess.run(
            [
                sys.executable,
                str(Path(__file__).with_name("denoise_review.py")),
                "--oidn",
                str(args.oidn),
                "--input",
                str(source),
                "--output",
                str(temporary),
            ],
            stdout=log,
            stderr=subprocess.STDOUT,
            check=True,
        )
    # Le fichier final n’apparaît qu’une fois l’image entièrement enregistrée.
    temporary.replace(target)
    return frame


with ThreadPoolExecutor(max_workers=args.workers) as pool:
    for done, future in enumerate(
        as_completed(pool.submit(denoise, frame) for frame in range(1, frames + 1)), 1
    ):
        future.result()
        if done % 12 == 0 or done == frames:
            print(f"Images débruitées : {done}/{frames}", flush=True)

subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-loglevel",
        "warning",
        "-framerate",
        str(metadata["fps"]),
        "-start_number",
        "1",
        "-i",
        str(clean / "frame-%04d.png"),
        "-frames:v",
        str(frames),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-g",
        "12",
        "-keyint_min",
        "12",
        "-sc_threshold",
        "0",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-movflags",
        "+faststart",
        str(folder / "preview-v01.mp4"),
    ],
    check=True,
)
Image.open(clean / "frame-0001.png").convert("RGB").save(
    folder / "poster-v01.jpg", quality=94
)
print("Vidéo prête :", folder / "preview-v01.mp4", flush=True)
