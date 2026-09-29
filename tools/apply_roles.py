# Writes the role marks from docs/roles-draft.csv into data.js as `roles: [...]`.
# Usage (from the repo root): python tools/apply_roles.py
# Rows are matched to works by order (No column); re-running replaces existing roles.
import csv
import json
import re

COLUMNS = [("監督", "director"), ("アニメーション", "animation"), ("編集", "editing"), ("イラスト", "illustration")]

with open("docs/roles-draft.csv", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

src = open("data.js", encoding="utf-8").read()
src = re.sub(r'\n    roles: \[[^\]]*\],', "", src)

credit_lines = list(re.finditer(r'\n    credit: "(?:[^"\\]|\\.)*",', src))
if len(credit_lines) != len(rows):
    raise SystemExit(f"CSV has {len(rows)} rows but data.js has {len(credit_lines)} works")

out, last = [], 0
for m, row in zip(credit_lines, rows):
    roles = [key for label, key in COLUMNS if row[label].strip()]
    out.append(src[last:m.end()])
    out.append("\n    roles: " + json.dumps(roles) + ",")
    last = m.end()
out.append(src[last:])

open("data.js", "w", encoding="utf-8", newline="").write("".join(out))
print(f"applied roles to {len(rows)} works")
