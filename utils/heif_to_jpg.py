#!/usr/bin/env python3
"""
HEIF / HEIC → JPEG converter.

Why this exists
---------------
iPhone photos are HEIC by default. When AirDrop / Google-Drive /
WhatsApp save them to disk, they often get a `.jpg` extension but the
file *contents* are still HEIC. Browsers can't decode them, so they
fail silently on the web. This script detects HEIC by magic bytes —
not by extension — and re-encodes to real JPEG, preserving EXIF
(crucially, the Orientation tag so phones-held-portrait don't render
sideways in the browser).

Usage
-----
    python utils/heif_to_jpg.py <input> <output_dir>

Where <input> is either a single file or a directory. The output dir
is created if missing; existing files in it are overwritten.

Examples
--------
    # Convert the gallery folder in-place into a new "gallery-web" sibling:
    python utils/heif_to_jpg.py public/assets/gallery public/assets/gallery-web

    # Convert one file:
    python utils/heif_to_jpg.py shot.jpg ./converted

    # Also copy any real JPEGs over so the output dir is a complete set:
    python utils/heif_to_jpg.py public/assets/gallery web --copy-jpegs

Dependencies
------------
    pip install pillow-heif Pillow

`pillow-heif` registers itself as a Pillow plugin so `Image.open()`
handles `.heic` / `.heif` files (and the malformed-extension HEIF
files we get from iPhones) transparently.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
    import pillow_heif
except ImportError:
    sys.exit(
        "Missing dependencies. Install with:\n"
        "  pip install pillow-heif Pillow"
    )

pillow_heif.register_heif_opener()


# Bytes 4–12 of an ISO-BMFF file are the `ftyp` box header. HEIC files
# carry one of these "brand" identifiers there. Detecting by header
# means we catch .jpg-extension HEIF files that iPhones save.
_HEIF_BRANDS = {
    b"ftypheic",
    b"ftypheix",
    b"ftyphevc",
    b"ftyphevx",
    b"ftypheim",
    b"ftypheis",
    b"ftyphevm",
    b"ftyphevs",
    b"ftypmif1",  # Multi-Image File Format (HEIF base)
    b"ftypmsf1",  # Multi-Image Sequence Format
}


def is_heif(path: Path) -> bool:
    """Return True iff `path` is a HEIF/HEIC file (regardless of suffix)."""
    try:
        with path.open("rb") as f:
            header = f.read(12)
    except OSError:
        return False
    if len(header) < 12:
        return False
    return header[4:12] in _HEIF_BRANDS


def _apply_max_edge(image: "Image.Image", max_edge: int | None) -> "Image.Image":
    """Return an image whose longest side is at most `max_edge` pixels
    (preserving aspect ratio). Passing None or 0 returns the image
    unchanged."""
    if not max_edge:
        return image
    w, h = image.size
    longest = max(w, h)
    if longest <= max_edge:
        return image
    scale = max_edge / longest
    new_size = (int(round(w * scale)), int(round(h * scale)))
    return image.resize(new_size, Image.LANCZOS)


def convert_to_jpeg(
    src: Path,
    out_dir: Path,
    quality: int = 90,
    max_edge: int | None = None,
) -> Path:
    """Convert a single HEIF file to JPEG inside `out_dir`. Returns the
    destination path. Caller is responsible for checking that `src` is
    actually HEIF (use `is_heif`)."""
    image = Image.open(src)
    exif = image.info.get("exif")  # preserved so orientation survives
    image = _apply_max_edge(image, max_edge)
    dst = out_dir / f"{src.stem}.jpg"
    image.convert("RGB").save(dst, "JPEG", quality=quality, exif=exif)
    return dst


def downscale_jpeg(
    src: Path,
    out_dir: Path,
    quality: int = 90,
    max_edge: int | None = None,
) -> Path:
    """Re-encode a real JPEG into `out_dir`, optionally downscaled.
    Used when `--copy-jpegs` is set together with `--max-edge` so the
    output folder is a complete, uniformly-sized drop-in set."""
    image = Image.open(src)
    exif = image.info.get("exif")
    image = _apply_max_edge(image, max_edge)
    dst = out_dir / src.name
    image.convert("RGB").save(dst, "JPEG", quality=quality, exif=exif)
    return dst


def _iter_inputs(path: Path) -> list[Path]:
    if path.is_file():
        return [path]
    return sorted(p for p in path.iterdir() if p.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert HEIF/HEIC files (including .jpg-extension HEIF) to JPEG.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Input file or directory (directory is scanned non-recursively).",
    )
    parser.add_argument(
        "output",
        type=Path,
        help="Output directory (created if missing).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=90,
        metavar="N",
        help="JPEG quality 1–100 (default: 90).",
    )
    parser.add_argument(
        "--max-edge",
        type=int,
        default=0,
        metavar="PX",
        help="Downscale so the longest side is at most this many pixels. "
             "Applied to HEIF→JPEG conversions AND (with --copy-jpegs) to "
             "existing JPEGs. 0 = no downscale (default).",
    )
    parser.add_argument(
        "--copy-jpegs",
        action="store_true",
        help="Also include real JPEGs in the output folder. If --max-edge "
             "is set they're downscaled too; otherwise byte-copied unchanged. "
             "Use this to produce a complete drop-in replacement set.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print the summary line at the end.",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"error: input not found: {args.input}", file=sys.stderr)
        return 2

    args.output.mkdir(parents=True, exist_ok=True)

    sources = _iter_inputs(args.input)
    converted = copied = skipped = errors = 0

    max_edge = args.max_edge if args.max_edge > 0 else None

    for src in sources:
        try:
            if is_heif(src):
                dst = convert_to_jpeg(
                    src, args.output, quality=args.quality, max_edge=max_edge,
                )
                if not args.quiet:
                    print(f"  converted  {src.name} → {dst.name}")
                converted += 1
            elif args.copy_jpegs and src.suffix.lower() in {".jpg", ".jpeg"}:
                if max_edge:
                    # Re-encode through Pillow so we can downscale.
                    dst = downscale_jpeg(
                        src, args.output, quality=args.quality, max_edge=max_edge,
                    )
                else:
                    dst = args.output / src.name
                    dst.write_bytes(src.read_bytes())
                if not args.quiet:
                    print(f"  copied     {src.name}")
                copied += 1
            else:
                if not args.quiet:
                    print(f"  skipped    {src.name} (not HEIF)")
                skipped += 1
        except Exception as exc:  # noqa: BLE001 — surface any per-file failure
            print(f"  error      {src.name}: {exc}", file=sys.stderr)
            errors += 1

    print(
        f"\nDone — converted {converted}, copied {copied}, "
        f"skipped {skipped}, errors {errors}"
    )
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
