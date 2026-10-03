# Shared helpers for generate_work_pages.py and make_ogp.py. Run scripts from the repo root.
import json
import os
import subprocess
from pathlib import Path

os.chdir(Path(__file__).resolve().parent.parent)

SITE = "https://architravework.github.io/architrave/"
PERSON_ID = SITE + "#person"
# Keep in sync with ROLE_LABELS in script.js
ROLE_LABELS = {"editing": "編集", "director": "監督", "animation": "アニメーション", "illustration": "イラスト"}
ROLE_ORDER = ["director", "animation", "illustration", "editing"]  # order for text and badges (director first)


def load_works():
    """Evaluates data.js with Node and returns the works array (file order preserved)."""
    js = ("const fs=require('fs');"
          "const src=fs.readFileSync('data.js','utf8');"
          "const works=new Function(src+';return works;')();"
          "process.stdout.write(JSON.stringify(works));")
    out = subprocess.run(["node", "-e", js], capture_output=True, check=True).stdout
    return json.loads(out.decode("utf-8"))
