"""Débruitage des rendus Cycles avec l’exécutable officiel Open Image Denoise.

Seuls les pixels bruités du rendu sont filtrés : aucun modèle ni pose n’est généré.
Les exports bruts sont conservés pour permettre de comparer le résultat.
"""

import argparse
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--oidn", type=Path, required=True)
parser.add_argument("--input", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
image = np.asarray(Image.open(args.input).convert("RGB"), dtype=np.float32) / 255
height, width = image.shape[:2]
with tempfile.TemporaryDirectory(prefix="pizza-denoise-") as directory:
    source, target = Path(directory) / "raw.pfm", Path(directory) / "clean.pfm"
    with source.open("wb") as stream:
        stream.write(f"PF\n{width} {height}\n-1.0\n".encode())
        stream.write(np.flipud(image).astype("<f4").tobytes())
    subprocess.run(
        [
            str(args.oidn.resolve()),
            "-d",
            "cpu",
            "--ldr",
            str(source),
            "--srgb",
            "-o",
            str(target),
            "--threads",
            "1",
            "--affinity",
            "0",
        ],
        check=True,
    )
    with target.open("rb") as stream:
        if stream.readline().strip() != b"PF":
            raise ValueError("Le débruiteur doit retourner une image RGB PFM.")
        output_width, output_height = map(int, stream.readline().split())
        scale = float(stream.readline())
        pixels = np.frombuffer(stream.read(), dtype="<f4" if scale < 0 else ">f4")
    pixels = np.flipud(pixels.reshape(output_height, output_width, 3))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.rint(pixels * 255), 0, 255).astype("uint8")).save(
        args.output
    )
print(args.output)
