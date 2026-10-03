# Fetches upload date and length of every work from YouTube watch pages into tools/youtube_meta.json.
# Already cached IDs are skipped. Usage (from the repo root): python tools/fetch_youtube_meta.py
import json
import re
import time
import urllib.request
from pathlib import Path

import site_data

CACHE = Path("tools/youtube_meta.json")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36")

works = site_data.load_works()
meta = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
failed = []

for w in works:
    vid = w["youtubeId"]
    if vid in meta:
        continue
    try:
        req = urllib.request.Request("https://www.youtube.com/watch?v=" + vid,
                                     headers={"User-Agent": UA, "Accept-Language": "ja"})
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
        up = re.search(r'"uploadDate":"([^"]+)"', html)
        ln = re.search(r'"lengthSeconds":"(\d+)"', html)
        if not up or not ln:
            raise ValueError("fields not found")
        meta[vid] = {"uploadDate": up.group(1), "lengthSeconds": int(ln.group(1))}
    except Exception as e:
        failed.append((vid, str(e)))
    time.sleep(1)

CACHE.write_text(json.dumps(dict(sorted(meta.items())), ensure_ascii=False, indent=1) + "\n",
                 encoding="utf-8", newline="\n")

mismatch = [(w["youtubeId"], w["year"], meta[w["youtubeId"]]["uploadDate"][:4])
            for w in works if w["youtubeId"] in meta and str(w["year"]) != meta[w["youtubeId"]]["uploadDate"][:4]]
print(f"cached: {sum(1 for w in works if w['youtubeId'] in meta)}/{len(works)}, failed: {len(failed)}")
for vid, err in failed:
    print("  FAILED", vid, err)
print(f"year mismatches: {len(mismatch)}")
for vid, y, u in mismatch:
    print("  MISMATCH", vid, "data.js year", y, "upload year", u)
