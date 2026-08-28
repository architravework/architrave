# Architrave Portfolio Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 9-work static-site prototype of architrave.myportfolio.com (header with nav positioned next to the logo, a thumbnail grid, and a YouTube lightbox modal), ready to deploy to GitHub Pages.

**Architecture:** Single-page static site, no build step — `index.html` + `style.css` + `data.js` (work data array) + `script.js` (renders the grid from `data.js` and drives a lightbox modal). Same "single-file, zero-dependency" spirit as `pomodoro-timer/index.html` in the parent working folder.

**Tech Stack:** Plain HTML5, CSS3, vanilla JS (ES5-compatible, no build tooling, no npm dependencies). Served locally for testing via `npx serve`.

**Spec:** [docs/superpowers/specs/2026-08-27-architrave-portfolio-design.md](../specs/2026-08-27-architrave-portfolio-design.md)

## Global Constraints

- No build tools, no npm dependencies, no framework — matches the design spec's "静的サイト、ビルドツールなし" requirement.
- Images are self-hosted in `images/` (downloaded from the source CDN), never hot-linked to `cdn.myportfolio.com`.
- This phase covers exactly 9 works. Adding the remaining ~70 is out of scope (see spec's "将来フェーズ").
- Nav links are dummy (`href="#"`) — multi-page routing is out of scope this phase.

---

### Task 1: Project scaffold and header layout

**Files:**
- Create: `index.html`
- Create: `style.css`

**Interfaces:**
- Produces: `#grid` container element (empty `<div id="grid" class="grid">` in `index.html`) that Task 5 will populate.
- Produces: `.site-header`, `.nav-container`, `.logo-wrap` CSS classes that later tasks build on without modifying.

- [x] **Step 1: Write `index.html` with header markup**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARCHITRAVE WORK</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
  <nav class="nav-container">
    <a href="#">HOME</a>
    <a href="#">制作実績</a>
    <a href="#">ご依頼について</a>
    <a href="#">GALLERY</a>
  </nav>
  <div class="logo-wrap">
    <div class="logo">ARCHITRAVE<br>WORK</div>
  </div>
</header>
<main>
  <div id="grid" class="grid"></div>
</main>
<div id="modal" class="modal hidden">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button id="modal-close" class="modal-close" aria-label="閉じる">&times;</button>
    <div class="video-wrap">
      <iframe id="modal-iframe" src="" title="video player" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>
  </div>
</div>
<script src="data.js"></script>
<script src="script.js"></script>
</body>
</html>
```

- [x] **Step 2: Write `style.css` with base + header styles**

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  color: #111;
}
a { color: inherit; }

.site-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  padding: 20px 40px;
  border-bottom: 1px solid #eee;
}
.nav-container { text-align: right; }
.nav-container a {
  margin-left: 20px;
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.logo {
  font-weight: 700;
  text-align: right;
  line-height: 1.3;
  letter-spacing: 0.05em;
}
```

- [x] **Step 3: Verify header layout in the browser**

Serve the folder and open it:

```bash
npx --yes serve . -l 8732
```

In the browser dev console on `http://localhost:8732`, run:

```js
(function(){
  const nav = document.querySelector('.nav-container').getBoundingClientRect();
  const logo = document.querySelector('.logo-wrap').getBoundingClientRect();
  return { gap: logo.left - nav.right };
})();
```

Expected: `gap` is a small positive number (roughly 0–25), confirming the nav sits right next to the logo instead of pinned to the far left.

- [x] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "Add page scaffold with header nav positioned next to logo"
```

---

### Task 2: Download the 9 sample thumbnail images

**Files:**
- Create: `images/01.jpg` through `images/09.jpg` (01 is actually a `.png` source but is saved as `.jpg` per naming below — see step 1 note)

**Interfaces:**
- Produces: `images/0N.jpg` files that `data.js` (Task 3) references by exact path.

- [x] **Step 1: Download each image from the source CDN**

```bash
mkdir -p images
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/a622b229-9036-4ceb-874f-5361ac71a358_car_16x9.png?h=91d3e3d43369fa5e64d42a640d9a2ac0" -o images/01.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/b4d7f511-d2e0-4706-a26c-f0be735d1444_car_16x9.jpg?h=c40cad202c0f5083408488a901540284" -o images/02.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/8f936eb4-395c-4db2-b9df-5ed4fa3c2d9b_car_16x9.jpg?h=1a3842946db9aa875a40f13fb00c8aee" -o images/03.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/b6925a17-fdca-4bc6-a457-82b670d3cc90_car_16x9.jpg?h=7228617660698bea0679c378f68bb772" -o images/04.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/5a575cf4-b297-4945-90c1-f3df411f6615_car_16x9.jpg?h=8b8c0eb396ad7df9f9b4f0a62f342796" -o images/05.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/613a0aaa-ab90-4165-8134-9cabb4a97992_car_16x9.jpg?h=38a1b6c6e1c565faa3027f4be88173d6" -o images/06.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/c5b968e2-aa47-4108-940e-7037e2bf3bca_car_16x9.jpg?h=c111063f60daf7c16b938504e331693a" -o images/07.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/f59a4493-08de-4eb5-b4c5-d1c4fd3004b6_car_16x9.jpg?h=14803766f5e78ef271c39268025f6d94" -o images/08.jpg
curl -sL "https://cdn.myportfolio.com/7099f2d6-ef2a-45f7-a612-1f59a18469fc/abd1ddbf-77e2-4329-836d-f17535ebd030_car_16x9.jpg?h=bee6cd2b325291babf4c5f66f0e147b2" -o images/09.jpg
```

- [x] **Step 2: Verify all 9 files downloaded and are non-empty**

```bash
ls -la images/
```

Expected: 9 files named `01.jpg`–`09.jpg`, each with a non-zero size (a few hundred KB is typical for a 16:9 thumbnail).

- [x] **Step 3: Commit**

```bash
git add images/
git commit -m "Add downloaded thumbnail images for prototype works"
```

---

### Task 3: Work data (`data.js`)

**Files:**
- Create: `data.js`

**Interfaces:**
- Consumes: `images/01.jpg`–`images/09.jpg` from Task 2.
- Produces: global `const works` — an array of `{ title: string, year: number, youtubeId: string, thumbnail: string }` objects, in the exact order shown on the live site. Task 4 (`script.js`) reads this array by the name `works`.

- [x] **Step 1: Write `data.js`**

```js
const works = [
  { title: "エンドロール - クワガタP feat. 重音テト", year: 2026, youtubeId: "fepw6wKU8D8", thumbnail: "images/01.jpg" },
  { title: "ねむ「当たり前の終止符」Music Video", year: 2026, youtubeId: "XFhPR9i27eQ", thumbnail: "images/02.jpg" },
  { title: "メタリックセイメイ「夏のカレンダー」Music Video", year: 2026, youtubeId: "nVs1prnygiE", thumbnail: "images/03.jpg" },
  { title: "「まいっちゃう」MASA×都鳥-TOTORI-×あーきとれーぶ(アトリエプロジェクト)", year: 2024, youtubeId: "QJsTcvAufng", thumbnail: "images/04.jpg" },
  { title: "宇宙パイロット「トワレ」OFFICIAL MUSIC VIDEO", year: 2026, youtubeId: "Rowmkcclsm0", thumbnail: "images/05.jpg" },
  { title: "GREEEEN / TO ALL SPORTS LOVERS　アルバムショート動画", year: 2024, youtubeId: "q23YpekQmYQ", thumbnail: "images/06.jpg" },
  { title: "FMV３クスッギフト　3月配信映像　【ディレクション】", year: 2025, youtubeId: "7v4eX-Q8k34", thumbnail: "images/07.jpg" },
  { title: "監督したアニメがファミマで見れます！", year: 2024, youtubeId: "4SJyfo-5izU", thumbnail: "images/08.jpg" },
  { title: "GRE4N BOYZ / 「星の詩」LYRIC VIDEO", year: 2025, youtubeId: "7lqJ-3v1k1A", thumbnail: "images/09.jpg" }
];
```

- [x] **Step 2: Verify syntax and content**

```bash
node --check data.js
node -e "eval(require('fs').readFileSync('data.js','utf8')); console.log(works.length, works[0].youtubeId)"
```

Expected: no syntax error from `node --check`; the second command prints `9 fepw6wKU8D8`.

- [x] **Step 3: Commit**

```bash
git add data.js
git commit -m "Add work data for 9 prototype entries"
```

---

### Task 4: Grid rendering (`script.js`)

**Files:**
- Create: `script.js`
- Modify: `style.css` (append grid/card rules)

**Interfaces:**
- Consumes: `works` array from `data.js` (Task 3); `#grid` element from `index.html` (Task 1).
- Produces: `renderGrid()` function and `.card` elements with a `data-youtube-id` attribute, which Task 5 (modal) reads via click handlers.

- [x] **Step 1: Append grid/card CSS to `style.css`**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.card {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  cursor: pointer;
}
.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.card:hover img { transform: scale(1.05); }
```

- [x] **Step 2: Write `script.js` with `renderGrid()`**

```js
(function () {
  function renderGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    works.forEach(function (work) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.youtubeId = work.youtubeId;

      const img = document.createElement("img");
      img.src = work.thumbnail;
      img.alt = work.title;
      card.appendChild(img);

      card.addEventListener("click", function () {
        openModal(work.youtubeId);
      });

      container.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", renderGrid);

  window.renderGrid = renderGrid;
})();
```

Note: `openModal` is defined in Task 5 — this task will show a console error on click until Task 5 lands, which is expected and resolved by the next task.

- [x] **Step 3: Verify grid renders**

Reload `http://localhost:8732` and run in the browser console:

```js
document.querySelectorAll('#grid .card').length
```

Expected: `9`. Also run:

```js
document.querySelectorAll('#grid .card img')[0].getAttribute('alt')
```

Expected: `"エンドロール - クワガタP feat. 重音テト"`.

- [x] **Step 4: Commit**

```bash
git add script.js style.css
git commit -m "Render work grid from data.js"
```

---

### Task 5: Lightbox modal for YouTube playback

**Files:**
- Modify: `script.js` (add `openModal`/`closeModal`)
- Modify: `style.css` (append modal rules)

**Interfaces:**
- Consumes: `#modal`, `#modal-iframe`, `#modal-close`, `.modal-backdrop` elements from `index.html` (Task 1); click events from `.card` elements (Task 4).
- Produces: `openModal(youtubeId: string)` and `closeModal()` functions, called by Task 4's card click handler and this task's own close/backdrop handlers.

- [x] **Step 1: Append modal CSS to `style.css`**

```css
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal.hidden { display: none; }
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
}
.modal-content {
  position: relative;
  width: min(90vw, 960px);
}
.video-wrap {
  position: relative;
  padding-top: 56.25%;
}
.video-wrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: 0;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
}
```

- [x] **Step 2: Add `openModal`/`closeModal` to `script.js`**

Insert inside the existing IIFE in `script.js`, above the `document.addEventListener("DOMContentLoaded", renderGrid);` line:

```js
  function openModal(youtubeId) {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1";
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    iframe.src = "";
    modal.classList.add("hidden");
  }

  function initModal() {
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  }
```

And change the `DOMContentLoaded` listener to:

```js
  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    initModal();
  });
```

- [x] **Step 3: Verify modal opens and closes**

Reload `http://localhost:8732` and run in the browser console:

```js
document.querySelector('#grid .card').click();
document.getElementById('modal').classList.contains('hidden')
```

Expected: `false` (modal visible) immediately after the click.

```js
document.getElementById('modal-iframe').src
```

Expected: a string starting with `https://www.youtube.com/embed/fepw6wKU8D8`.

```js
document.getElementById('modal-close').click();
document.getElementById('modal').classList.contains('hidden')
```

Expected: `true`, and:

```js
document.getElementById('modal-iframe').src
```

Expected: `""` (empty, confirming playback stopped).

- [x] **Step 4: Commit**

```bash
git add script.js style.css
git commit -m "Add YouTube lightbox modal triggered by grid card clicks"
```

---

### Task 6: Full visual verification

**Files:** none (verification only)

**Interfaces:** none — this task exercises the complete page built by Tasks 1–5.

- [x] **Step 1: Reload the full page and take a screenshot**

With the server from Task 1 still running at `http://localhost:8732`, load the page in the Browser pane, then capture a screenshot and confirm visually:
- Header: nav links sit immediately to the left of the "ARCHITRAVE WORK" logo (no large gap)
- Grid: 3 columns × 3 rows of thumbnails, no broken images
- Clicking a thumbnail opens the modal with a playing YouTube video; the close button and backdrop click both close it

- [x] **Step 2: Check browser console for errors**

Read the console messages for the page. Expected: no errors (warnings about YouTube's own embedded scripts are fine and expected).

- [x] **Step 3: Stop the local server**

```bash
# stop the process started in Task 1 (Ctrl+C, or kill the background job)
```

---

### Task 7 (manual, requires user go-ahead): Publish to GitHub Pages

**Files:** none (repo/hosting operations only)

**Interfaces:** none.

This task pushes code to a public remote and is **not** to be run automatically — confirm with the user before executing, per the standing rule that pushing code and creating remote resources needs explicit sign-off each time.

- [ ] **Step 1: Confirm with the user** — repo name (`architrave-portfolio`, already agreed), and that they're ready to make it public on their GitHub account.

- [ ] **Step 2: Create the GitHub repo and push** (only after confirmation)

```bash
gh repo create architrave-portfolio --public --source=. --remote=origin --push
```

- [ ] **Step 3: Enable GitHub Pages**

```bash
gh api repos/{owner}/architrave-portfolio/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```

(Replace `{owner}` with the account `gh` reports, or enable it via the repo's Settings → Pages tab in the browser if `gh api` access to Pages isn't available.)

- [ ] **Step 4: Verify the live site**

Open `https://<owner>.github.io/architrave-portfolio/` in the browser and repeat the Task 6 checks against the live URL.

---

## Self-Review Notes

- Spec coverage: 技術構成→Tasks 1/3/4/5; 画像の扱い→Task 2; デザイン(ヘッダー)→Task 1; データフロー→Tasks 3–5; テスト→Task 6; デプロイ→Task 7. All spec sections have a corresponding task.
- No placeholders: all 9 works have real titles/years/YouTube IDs/image URLs captured from the live site; all code blocks are complete, not sketches.
- Type/name consistency checked: `works`, `renderGrid`, `openModal`, `closeModal`, `data-youtube-id`/`dataset.youtubeId`, and element IDs (`grid`, `modal`, `modal-iframe`, `modal-close`) are used identically across Tasks 1, 3, 4, and 5.
