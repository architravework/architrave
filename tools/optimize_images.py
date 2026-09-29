# Shrinks work thumbnails in images/ for the grid (shown ~335px wide, 2x for retina).
# Usage (from the repo root): python tools/optimize_images.py
# Safe to re-run: files already within MAX_WIDTH and MAX_KB are left untouched.
import os
from PIL import Image

MAX_WIDTH = 800
MAX_KB = 150
QUALITY = 82

before = after = 0
for name in sorted(os.listdir("images")):
    if not name.lower().endswith((".jpg", ".jpeg")):
        continue
    path = os.path.join("images", name)
    size = os.path.getsize(path)
    before += size
    im = Image.open(path)
    if im.width <= MAX_WIDTH and size <= MAX_KB * 1024:
        after += size
        continue
    im = im.convert("RGB")
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    im.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    after += os.path.getsize(path)

print(f"images/: {before / 1048576:.1f}MB -> {after / 1048576:.1f}MB")
