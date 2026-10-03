# Builds ogp.jpg (1200x630), the share image for X/LINE etc., from the first 16 work thumbnails.
# Usage (from the repo root): python tools/make_ogp.py
# Usage for per-work images (ogp/work-<id>.jpg): python tools/make_ogp.py --works
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

import site_data

W, H, COLS, ROWS = 1200, 630, 4, 4


def make_work_images():
    works = site_data.load_works()
    out = Path("ogp")
    out.mkdir(exist_ok=True)
    title_font = ImageFont.truetype("C:/Windows/Fonts/YuGothB.ttc", 52)
    sub_font = ImageFont.truetype("C:/Windows/Fonts/YuGothB.ttc", 24)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    for w in works:
        im = Image.open(w["thumbnail"]).convert("RGB")
        im = im.resize((1200, 675), Image.LANCZOS)
        im = im.crop((0, 22, 1200, 652))  # centered 1200x630
        # Bottom 55%: vertical black gradient, alpha 0 -> 220
        grad_top = int(H * 0.45)
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for y in range(grad_top, H):
            a = round(220 * (y - grad_top) / (H - 1 - grad_top))
            od.line([(0, y), (W, y)], fill=(0, 0, 0, a))
        im = Image.alpha_composite(im.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(im)
        # Wrap the title by measured width (1080px), at most 2 lines
        lines, cur = [], ""
        for ch in w["title"]:
            if cur and probe.textlength(cur + ch, font=title_font) > 1080:
                lines.append(cur)
                cur = ""
            cur += ch
        lines.append(cur)
        if len(lines) > 2:
            lines = lines[:2]
            l2 = lines[1]
            while l2 and probe.textlength(l2 + "…", font=title_font) > 1080:
                l2 = l2[:-1]
            lines[1] = l2 + "…"
        base = 540
        for k, line in enumerate(reversed(lines)):
            draw.text((60, base - k * 66), line, font=title_font, fill="#fff", anchor="ls")
        draw.text((60, 585), "ARCHITRAVE WORK ｜ 映像制作 あーきとれーぶ", font=sub_font, fill="#cccccc", anchor="ls")
        im.save(out / f"work-{w['youtubeId']}.jpg", "JPEG", quality=82, optimize=True)
    ids = {w["youtubeId"] for w in works}
    for f in out.glob("work-*.jpg"):
        if f.stem[len("work-"):] not in ids:
            f.unlink()
    print(f"wrote {len(works)} images to ogp/")


parser = argparse.ArgumentParser()
parser.add_argument("--works", action="store_true", help="generate ogp/work-<id>.jpg for every work")
if parser.parse_args().works:
    make_work_images()
    raise SystemExit

thumbs = [w["thumbnail"] for w in site_data.load_works()][:COLS * ROWS]

canvas = Image.new("RGB", (W, H), "#111")
cell_w, cell_h = W // COLS, H // ROWS
for i, path in enumerate(thumbs):
    im = Image.open(path).convert("RGB")
    # Cover-crop each thumbnail into its cell
    scale = max(cell_w / im.width, cell_h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - cell_w) // 2, (im.height - cell_h) // 2
    canvas.paste(im.crop((left, top, left + cell_w, top + cell_h)), ((i % COLS) * cell_w, (i // COLS) * cell_h))

# Dark band with the site name across the middle
band_h = 150
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(overlay).rectangle([0, (H - band_h) // 2, W, (H + band_h) // 2], fill=(0, 0, 0, 190))
canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

draw = ImageDraw.Draw(canvas)
title_font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 64)
sub_font = ImageFont.truetype("C:/Windows/Fonts/YuGothB.ttc", 26)
draw.text((W // 2, H // 2 - 18), "ARCHITRAVE WORK", font=title_font, fill="#fff", anchor="mm")
draw.text((W // 2, H // 2 + 40), "映像クリエイター あーきとれーぶ ｜ MV・アニメーション・映像編集", font=sub_font, fill="#ddd", anchor="mm")

canvas.save("ogp.jpg", "JPEG", quality=85, optimize=True)
print("wrote ogp.jpg")
