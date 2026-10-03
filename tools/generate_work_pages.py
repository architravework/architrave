# Generates work/<id>/index.html for every work in data.js, plus sitemap.xml.
# Usage (from the repo root): python tools/generate_work_pages.py
import html
import json
import re
import shutil
from pathlib import Path

import site_data
from site_data import SITE, PERSON_ID, ROLE_LABELS, ROLE_ORDER

works = site_data.load_works()
n = len(works)
template = Path("tools/work-template.html").read_text(encoding="utf-8")
meta_path = Path("tools/youtube_meta.json")
yt_meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
esc = lambda s: html.escape(s, quote=True)


def clip(s, limit):
    return s if len(s) <= limit else s[:limit - 1] + "…"


def role_text(w):
    if w["roles"] == ["editing"]:
        return "映像編集"
    return "・".join(ROLE_LABELS[r] for r in ROLE_ORDER if r in w["roles"])


def summary(desc):
    keep = []
    for line in desc.splitlines():
        line = line.strip()
        if not line or "http" in line or line.startswith("#") or "：" in line or ":" in line:
            continue
        keep.append(line)
    return "　".join(keep)


def primary_role(w):
    return next((r for r in ROLE_ORDER if r in w["roles"]), None)


def linkify(text):
    t = esc(text)
    t = re.sub(r'https?://[^\s<>"）」]+',
               lambda m: f'<a href="{m.group(0)}" target="_blank" rel="noopener nofollow">{m.group(0)}</a>', t)
    return t.replace("\n", "<br>")


def duration(sec):
    m, s = divmod(int(sec), 60)
    h, m = divmod(m, 60)
    return "PT" + (f"{h}H" if h else "") + (f"{m}M" if m or h else "") + (f"{s}S" if s or not (m or h) else "")


def prefix_num(w):
    return re.search(r"images/(\d+)\.jpg", w["thumbnail"]).group(0)


def link(i, rel, arrow):
    w = works[i % n]
    return f'<a href="../{w["youtubeId"]}/" rel="{rel}">{arrow}</a>'


out_root = Path("work")
assert out_root.name == "work" and out_root.resolve().parent == Path.cwd().resolve()
if out_root.exists():
    shutil.rmtree(out_root)

fallback = 0
for i, w in enumerate(works):
    vid = w["youtubeId"]
    page_url = SITE + "work/" + vid + "/"
    rt = role_text(w)
    desc_meta = clip(f"{w['title']}。映像クリエイターあーきとれーぶが{rt}を担当。{summary(w['description'])}", 120)
    thumb_url = SITE + w["thumbnail"]
    if Path(f"ogp/work-{vid}.jpg").exists():
        og_url, og_w, og_h = SITE + f"ogp/work-{vid}.jpg", 1200, 630
    else:
        og_url, og_w, og_h = thumb_url, 800, 450

    m = yt_meta.get(vid)
    video = {
        "@type": "VideoObject",
        "name": w["title"],
        "description": desc_meta,
        "thumbnailUrl": [og_url, thumb_url],
        "uploadDate": m["uploadDate"] if m else f"{w['year']}-01-01",
    }
    if not m:
        fallback += 1
    if m and m.get("lengthSeconds"):
        video["duration"] = duration(m["lengthSeconds"])
    video.update({"embedUrl": "https://www.youtube.com/embed/" + vid, "url": page_url,
                  "creator": {"@id": PERSON_ID}})
    ld = {"@context": "https://schema.org", "@graph": [video, {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "HOME", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": w["title"], "item": page_url}]}]}
    json_ld = json.dumps(ld, ensure_ascii=False, indent=1).replace("</", "<" + chr(92) + "/")

    prev_i, next_i = (i - 1) % n, (i + 1) % n
    exclude = {i, prev_i, next_i}
    pr = primary_role(w)
    related = []
    for k in range(2, n + 2):
        j = (i + k) % n
        if j not in exclude and primary_role(works[j]) == pr and j not in related:
            related.append(j)
        if len(related) == 6:
            break
    for k in range(2, n + 2):
        if len(related) == 6:
            break
        j = (i + k) % n
        if j not in exclude and j not in related:
            related.append(j)
    related_html = "".join(
        f'<li><a href="../{works[j]["youtubeId"]}/"><img src="../../{works[j]["thumbnail"]}" '
        f'alt="{esc(works[j]["title"])}" loading="lazy" width="800" height="450">'
        f'<span>{esc(works[j]["title"])}</span></a></li>' for j in related)

    editing_only = all(r == "editing" for r in w["roles"])
    values = {
        "PAGE_TITLE": esc(f"{w['title']}｜{rt}：あーきとれーぶ - ARCHITRAVE WORK"),
        "META_DESCRIPTION": esc(desc_meta),
        "PAGE_URL": page_url,
        "OG_TITLE": esc(w["title"]),
        "OG_IMAGE_URL": og_url, "OG_IMAGE_W": str(og_w), "OG_IMAGE_H": str(og_h),
        "JSON_LD": json_ld,
        "TITLE": esc(w["title"]),
        "YOUTUBE_ID": vid,
        "YEAR": str(w["year"]),
        "ROLE_BADGES": "".join(f'<span class="role-badge">{ROLE_LABELS[r]}</span>'
                               for r in ROLE_ORDER if r in w["roles"]),
        "CREDIT_HTML": f'<p class="work-credit">{esc(w["credit"])}</p>' if w.get("credit") else "",
        "CONTACT_LABEL": "この作品のような映像編集を依頼する" if editing_only else "この作品のような映像制作を依頼する",
        "DESCRIPTION_HTML": linkify(w["description"]),
        "PREV_LINK": link(prev_i, "prev", "← " + esc(clip(works[prev_i]["title"], 24))),
        "NEXT_LINK": link(next_i, "next", esc(clip(works[next_i]["title"], 24)) + " →"),
        "RELATED_HTML": related_html,
    }
    page = re.sub(r"%%([A-Z_]+)%%", lambda m: values[m.group(1)], template)
    d = out_root / vid
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page, encoding="utf-8", newline="\n")

urls = [SITE, SITE + "contact.html", SITE + "gallery.html"] + [SITE + "work/" + w["youtubeId"] + "/" for w in works]
sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
Path("sitemap.xml").write_text(sitemap, encoding="utf-8", newline="\n")
print(f"Generated {n} work pages, sitemap.xml ({len(urls)} urls); uploadDate fallback: {fallback}")
