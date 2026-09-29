# Builds ogp.jpg (1200x630), the share image for X/LINE etc., from the first 16 work thumbnails.
# Usage (from the repo root): python tools/make_ogp.py
import re
from PIL import Image, ImageDraw, ImageFont

W, H, COLS, ROWS = 1200, 630, 4, 4
thumbs = re.findall(r'thumbnail: "([^"]+)"', open("data.js", encoding="utf-8").read())[:COLS * ROWS]

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
