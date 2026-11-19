from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageCms


def convert_to_cmyk(input_path: Path, output_path: Path, icc_path: Path | None) -> None:
    image = Image.open(input_path)

    if icc_path:
        srgb = ImageCms.createProfile("sRGB")
        cmyk = ImageCms.getOpenProfile(str(icc_path))
        converted = ImageCms.profileToProfile(
            image.convert("RGB"),
            srgb,
            cmyk,
            outputMode="CMYK",
        )
        icc_bytes = icc_path.read_bytes()
    else:
        converted = image.convert("CMYK")
        icc_bytes = None

    output_path.parent.mkdir(parents=True, exist_ok=True)
    save_kwargs = {
        "format": "JPEG",
        "quality": 95,
        "subsampling": 0,
        "dpi": (300, 300),
    }
    if icc_bytes:
        save_kwargs["icc_profile"] = icc_bytes

    converted.save(output_path, **save_kwargs)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert poster image to CMYK JPEG.")
    parser.add_argument("input", type=Path, help="Input PNG/JPG path")
    parser.add_argument("output", type=Path, help="Output CMYK JPG path")
    parser.add_argument(
        "--icc",
        type=Path,
        default=None,
        help="Optional CMYK ICC profile path from the print vendor",
    )
    args = parser.parse_args()

    convert_to_cmyk(args.input, args.output, args.icc)
    print(f"saved: {args.output}")


if __name__ == "__main__":
    main()
