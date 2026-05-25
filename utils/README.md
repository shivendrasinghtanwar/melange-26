# utils/

One-off / repeatable maintenance scripts that aren't part of the
runtime app. Anything in here should be runnable from the repo root.

## `heif_to_jpg.py` — HEIF/HEIC → JPEG converter

iPhones save photos as HEIC. When AirDropped / Google-Drive'd /
WhatsApp'd they often arrive with a `.jpg` extension but their actual
contents are still HEIC — which browsers can't decode. This script
detects HEIC by **magic bytes** (not extension) and re-encodes to real
JPEG, preserving the EXIF Orientation tag so portrait-shot phone
photos render upright on the web.

### Install

```bash
pip install pillow-heif Pillow
```

### Use

```bash
# Convert a directory to a sibling dir (recommended — keeps originals intact):
python utils/heif_to_jpg.py public/assets/gallery public/assets/gallery-web

# Convert one file:
python utils/heif_to_jpg.py shot.jpg converted/

# Also carry over any real JPEGs so the output is a complete drop-in set:
python utils/heif_to_jpg.py public/assets/gallery public/assets/gallery-web --copy-jpegs

# Tune JPEG quality (default 90):
python utils/heif_to_jpg.py in/ out/ --quality 85

# Downscale during conversion — long edge at most 1600px. Applied to
# HEIF→JPEG conversions AND (with --copy-jpegs) to existing JPEGs.
python utils/heif_to_jpg.py in/ out/ --copy-jpegs --max-edge 1600
```

### What it does

1. Walks the input (single file or directory, non-recursive).
2. For each file: reads the first 12 bytes and checks the ISO-BMFF
   `ftyp` brand. If it's one of the HEIF brands (`heic`, `heix`,
   `mif1`, `msf1`, …) → decode with `pillow-heif` and re-encode as
   JPEG into the output dir, preserving EXIF.
3. Files that are real JPEGs are skipped (or copied if you pass
   `--copy-jpegs`). Everything else is skipped with a note.
