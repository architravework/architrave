# 作業指示書：作品ページ生成によるSEO強化（Sonnet 実装用）

- リポジトリ: `E:\ai作業用\architrave-portfolio`（作業ブランチ: `master`）
- 本番: https://architravework.github.io/architrave/ （GitHub Pages プロジェクトサイト。パスは常に `/architrave/` 配下）
- **コミット・push はしない。** Phase 5 の報告で止めること。

---

## 0. 元案からの変更点（理由つき・必読）

| 元案 | 変更後 | 理由 |
|---|---|---|
| 案1: index.html に 89件の VideoObject を埋め込む | **やらない**。VideoObject は各作品ページにだけ置く。index.html は既存 Person に `@id` を1行足すだけ | Google の動画リッチリザルトは「その動画が主役のページ」が対象。一覧ページに89件並べても表示されず、HTMLが約150KB膨らむだけ |
| `data.js` を正規表現で JSON として抽出 | **Node で評価して JSON 化** | `data.js` はキーにクォートがなく、description はバッククォートのテンプレート文字列。JSON パースは必ず失敗する（Node v24 はインストール済み） |
| uploadDate は `{year}-01-15` 固定、duration は `PT0S` | **YouTube の視聴ページから実際の投稿日・尺を1回だけ取得してキャッシュ**。取れなければ `{year}-01-01`、duration は省略 | 架空の日付や `PT0S` は構造化データとして誤り。duration は任意項目なので、不明なら書かない |
| テンプレートで `{TITLE}` 置換＋JSON-LD を `{{ }}` で手書き | **プレースホルダは `%%NAME%%`、JSON-LD は `json.dumps` で生成して丸ごと差し込む** | タイトルに `"` や `「」`、説明に改行・URL・絵文字が入るため、手書き JSON は壊れる。HTML 側はすべて `html.escape` |
| テンプレートの CSS/リンクが `../style.css` | **`../../style.css`** | ページは `work/<id>/index.html` なので2階層上がる |
| sitemap.xml は自動生成されるので対応不要 | **生成スクリプトで sitemap.xml を全件再生成** | GitHub Pages は sitemap を自動生成しない。現在は手書きで3URLのみ |
| （記載なし） | **トップのカードを `<a href="work/<id>/">` にする** | 今のカードは `div`＋クリックイベントで、クローラーが辿れるリンクが存在しない。作品ページを作ってもリンクが無いと見つけてもらえない |
| （記載なし） | **モーダルの「リンクをコピー」を作品ページURLに変更** | `#work-xxx` のURLだとXで共有してもトップのOGPしか出ない。作品ページURLなら作品ごとのOGPが出る（ユーザー確認待ち。Phase 2-3 参照） |
| gh-pages に `tools/` も同期 | **`tools/` と `docs/` は同期しない** | 現在の gh-pages にも入っていない（公開不要なビルド用ファイル） |
| og:image を先に参照し、生成は後回し | **OGP画像が無ければ `images/<n>.jpg` にフォールバック** | Phase 順にかかわらず壊れたリンクを出さない |

---

## Phase 1: 作品ページ生成スクリプト

### 1-1. `tools/site_data.py`（共通モジュール・新規）

`generate_work_pages.py` と `make_ogp.py` の両方から使う。

```python
SITE = "https://architravework.github.io/architrave/"
PERSON_ID = SITE + "#person"
ROLE_LABELS = {"editing": "編集", "director": "監督", "animation": "アニメーション", "illustration": "イラスト"}
ROLE_ORDER = ["director", "animation", "illustration", "editing"]  # 文章・バッジに出す順（監督を先頭に）

def load_works():
    """data.js を Node で評価して works 配列を返す（ファイル順を保持）。"""
    js = ("const fs=require('fs');"
          "const src=fs.readFileSync('data.js','utf8');"
          "const works=new Function(src+';return works;')();"
          "process.stdout.write(JSON.stringify(works));")
    out = subprocess.run(["node", "-e", js], capture_output=True, check=True).stdout
    return json.loads(out.decode("utf-8"))   # Windows では必ず bytes→utf-8 で decode
```

- 実行はリポジトリ直下から（既存 `make_ogp.py` と同じ前提）。スクリプト冒頭で `os.chdir(Path(__file__).resolve().parent.parent)` しておくと安全。
- `ROLE_LABELS` は `script.js` の定義と一致させる（コメントで「script.js と同期」と書く）。

### 1-2. `tools/fetch_youtube_meta.py`（新規・ネットワーク使用）

- 出力: `tools/youtube_meta.json` → `{"<youtubeId>": {"uploadDate": "2024-03-01T04:00:06-08:00", "lengthSeconds": 215}, ...}`（キーでソートして保存、`ensure_ascii=False, indent=1`）
- 既にキャッシュにある ID はスキップ（作品追加時は新規分だけ取りに行く）。
- 取得方法: `urllib.request` で `https://www.youtube.com/watch?v=<id>` を取得。ヘッダ `User-Agent`（一般的なブラウザUA）と `Accept-Language: ja`。正規表現で
  - `"uploadDate":"([^"]+)"`
  - `"lengthSeconds":"(\d+)"`
- リクエスト間に `time.sleep(1)`。失敗した ID はキャッシュに書かず、最後に一覧を表示。
- `data.js` の `year` と uploadDate の年が違う作品があれば **警告として一覧表示するだけ**（data.js は変更しない。報告に含める）。
- このスクリプトが全滅しても Phase 1-3 は動くこと（フォールバックあり）。

### 1-3. `tools/work-template.html`（新規）

プレースホルダは `%%NAME%%` 形式。HTML に入る値はすべて生成側でエスケープ済みのものを渡す。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" sizes="32x32" href="../../favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="../../favicon-180.png">
<title>%%PAGE_TITLE%%</title>
<meta name="description" content="%%META_DESCRIPTION%%">
<link rel="canonical" href="%%PAGE_URL%%">
<meta property="og:type" content="video.other">
<meta property="og:site_name" content="ARCHITRAVE WORK">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="%%OG_TITLE%%">
<meta property="og:description" content="%%META_DESCRIPTION%%">
<meta property="og:image" content="%%OG_IMAGE_URL%%">
<meta property="og:image:width" content="%%OG_IMAGE_W%%">
<meta property="og:image:height" content="%%OG_IMAGE_H%%">
<meta property="og:url" content="%%PAGE_URL%%">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
%%JSON_LD%%
</script>
%%ANALYTICS%%
<link rel="stylesheet" href="../../style.css">
</head>
<body class="work-page">
<header class="site-header"> … index.html の <header> をコピーし、href を ../../index.html 等に書き換え … </header>

<main class="work-detail">
  <nav class="work-breadcrumb" aria-label="パンくず"><a href="../../">HOME</a> › <span>%%TITLE%%</span></nav>
  <div class="work-video">
    <iframe src="https://www.youtube.com/embed/%%YOUTUBE_ID%%" title="%%TITLE%%"
      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
  </div>
  <h1 class="work-title">%%TITLE%%</h1>
  <p class="work-meta"><span class="work-year">%%YEAR%%</span> %%ROLE_BADGES%%</p>
  <p class="work-credit">%%CREDIT%%</p>
  <div class="work-actions">
    <a class="work-button" href="https://www.youtube.com/watch?v=%%YOUTUBE_ID%%" target="_blank" rel="noopener">YouTubeで見る</a>
    <a class="work-button work-button-primary" href="../../contact.html?ref=%%YOUTUBE_ID%%">%%CONTACT_LABEL%%</a>
  </div>
  <section class="work-description">
    <h2>概要</h2>
    <p>%%DESCRIPTION_HTML%%</p>
  </section>
  <nav class="work-pager">%%PREV_LINK%% <a href="../../#work-%%YOUTUBE_ID%%">作品一覧</a> %%NEXT_LINK%%</nav>
  <section class="work-related">
    <h2>その他の作品</h2>
    <ul class="work-related-list">%%RELATED_HTML%%</ul>
  </section>
</main>
<footer> … index.html のSNSリンク（X / TikTok / YouTube）を同じマークアップでコピー … </footer>
</body>
</html>
```

`%%ANALYTICS%%` には **index.html の `<!-- Analytics opt-out ... -->` から gtag の `</script>` までのブロックをそのまま**入れる（テンプレートに直書きでよい）。作品ページの閲覧も GA で数えるため。

### 1-4. `tools/generate_work_pages.py`（新規）

各値の作り方（i = data.js 上の位置、n = 作品数）:

| プレースホルダ | 生成ルール |
|---|---|
| `PAGE_URL` | `SITE + "work/" + id + "/"` |
| `TITLE` | `html.escape(title)` |
| `PAGE_TITLE` | `f"{title}｜{役割文字列}：あーきとれーぶ - ARCHITRAVE WORK"`。役割文字列は `ROLE_ORDER` 順の日本語を `・` 連結（例: `監督・編集`）。roles が `["editing"]` のみなら `映像編集` |
| `OG_TITLE` | `title` をエスケープしたもの |
| `META_DESCRIPTION` | `f"{title}。映像クリエイターあーきとれーぶが{役割文字列}を担当。{要約}"` を **120文字で切り、切ったら末尾に `…`**。要約 = description を行分割し、`http` を含む行・`#` で始まる行・空行・`：`/`:` を含むクレジット行を除き、残りの先頭から連結して改行は全角スペースに |
| `CREDIT` | `html.escape(credit)`（空なら `<p>` ごと出さない） |
| `YEAR` | `year` |
| `ROLE_BADGES` | `ROLE_ORDER` 順に `<span class="role-badge">編集</span>`（既存クラスを再利用） |
| `CONTACT_LABEL` | roles が editing のみ → `この作品のような映像編集を依頼する`、それ以外 → `この作品のような映像制作を依頼する`（script.js の `renderContactLink` と同じ判定） |
| `DESCRIPTION_HTML` | description 全文を `html.escape` → URL（`https?://[^\s<>"）」]+`）を `<a href="..." target="_blank" rel="noopener nofollow">...</a>` に置換 → 改行を `<br>` に。**エスケープを先、リンク化を後** |
| `PREV_LINK` / `NEXT_LINK` | data.js 順で i-1 / i+1（端はループ）。`<a href="../<id>/" rel="prev">← <短縮タイトル></a>`。タイトルは24文字で切って `…` |
| `RELATED_HTML` | i+2 から順に、**同じ roles の主役割（ROLE_ORDER で最初に来るもの）を持つ作品**を最大6件（足りなければ data.js 順で補完、prev/next と自分は除外）。各 `<li><a href="../<id>/"><img src="../../images/NN.jpg" alt="タイトル" loading="lazy" width="800" height="450"><span>タイトル</span></a></li>` |
| `OG_IMAGE_URL` / `_W` / `_H` | `ogp/work-<id>.jpg` が存在すれば `SITE + "ogp/work-<id>.jpg"`, 1200, 630。無ければ `SITE + thumbnail`, 800, 450 |
| `JSON_LD` | 下記を `json.dumps(obj, ensure_ascii=False, indent=1)` し、`</` を `<\/` に置換 |

JSON-LD（`@graph` で2つ）:

```json
{
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": "VideoObject",
   "name": "<title>",
   "description": "<META_DESCRIPTION と同じ文字列（エスケープ前）>",
   "thumbnailUrl": ["<OG画像URL>", "<SITE + thumbnail>"],
   "uploadDate": "<youtube_meta の uploadDate。無ければ year-01-01>",
   "duration": "<lengthSeconds があれば PT#M#S。無ければキーごと省略>",
   "embedUrl": "https://www.youtube.com/embed/<id>",
   "url": "<PAGE_URL>",
   "creator": {"@id": "https://architravework.github.io/architrave/#person"}
  },
  {
   "@type": "BreadcrumbList",
   "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "HOME", "item": "https://architravework.github.io/architrave/"},
    {"@type": "ListItem", "position": 2, "name": "<title>", "item": "<PAGE_URL>"}
   ]
  }
 ]
}
```

スクリプトの動作:

1. `load_works()` → 作品を data.js 順で処理。
2. **`work/` を一度丸ごと削除してから再生成**（data.js から消えた作品のページを残さないため）。`shutil.rmtree` は `work` ディレクトリに限定し、パスを assert で確認してから実行。
3. 各ページを `work/<id>/index.html` に UTF-8・改行 `\n` で書き出す（`write_text(..., encoding="utf-8", newline="\n")`）。
4. **`sitemap.xml` を再生成**: 既存3URL（`/`, `contact.html`, `gallery.html`）＋全作品ページ。data.js 順。`lastmod` は付けない。
5. 出力は決定的にする（タイムスタンプ・乱数・dict順依存なし）。再実行して `git diff` が出ないこと。
6. 最後に `Generated 89 work pages, sitemap.xml (92 urls)` のように表示。uploadDate がフォールバックになった件数も表示。

### 1-5. `style.css` に作品ページ用スタイルを追加

- 末尾に `/* ===== Work detail page ===== */` セクションを追加。**既存セレクタは変更しない**。新規クラスはすべて `work-` 接頭辞。
- `.work-detail`: `max-width: 960px; margin: 0 auto; padding: 0 16px 64px;`
- `.work-video`: 16:9（`aspect-ratio: 16 / 9`、iframe は `width:100%; height:100%; border:0`）
- `.work-title`: サイトの既存見出しのフォント・色に合わせる（index.html の見出しやモーダルタイトルのスタイルを読んで揃える）
- `.work-related-list`: grid、PCは3列、`max-width: 600px` で2列。
- ボタン類はモーダルの contact ボタンの見た目に合わせる。
- スマホ幅（375px）で横スクロールが出ないこと。

---

## Phase 2: トップページ（index.html / script.js）の修正

### 2-1. index.html の Person に `@id` を追加（これだけ）

既存の Person JSON-LD に `"@id": "https://architravework.github.io/architrave/#person",` を1行追加。他の head は触らない。

### 2-2. カードをクローラブルなリンクにする（`script.js` の `renderGrid`）

- `document.createElement("div")` → `"a"`、`card.href = "work/" + work.youtubeId + "/";`
- `tabIndex` / `role="button"` / keydown ハンドラは削除（`<a>` は Enter で標準動作するため）。
- click ハンドラ:
  ```js
  card.addEventListener("click", function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // 新しいタブで開く操作は作品ページへ
    e.preventDefault();
    openModal(order.indexOf(index));
  });
  ```
- CSS: `.card` が `a` になったことで下線・文字色・`display` が変わらないか確認し、必要なら `.card { display:block; color:inherit; text-decoration:none; }` を追加。
- フィルタ（`applyRoleFilter`）やゲーム（`game.js`）が `.card` を `div` 前提で扱っていないか grep で確認。

### 2-3. 共有リンクを作品ページURLに（**ユーザー承認済み・実施する**）

- `workUrl(work)` を `new URL("work/" + work.youtubeId + "/", location.href).href` に変更すれば、「リンクをコピー」で作品ごとのOGPが出るURLになる。
- `#work-<id>` でモーダルが開く既存機能（`openFromHash`）と `history.replaceState` は**残す**（作品ページの「作品一覧」リンクと旧URLの互換のため）。
- 判断はユーザーが行う。Phase 5 の報告で「実装済み／未実装」のどちらかを明記すること。指示が無ければ**実装しておき、差し戻し可能な単独の変更として**報告する。

---

## Phase 3: 作品ごとの OGP 画像（`tools/make_ogp.py` 拡張）

- `argparse` で `--works` を追加。**引数なしの既存動作（トップの `ogp.jpg` 生成）は1バイトも変えない**。データ読み込みは `site_data.load_works()` に置き換えてよいが、出力が同一であることを確認。
- `--works` のとき、全作品について `ogp/work-<id>.jpg`（1200×630）を生成:
  1. 背景: `thumbnail`（800×450）を cover で 1200×675 に拡大（LANCZOS）→ 中央 1200×630 を切り出し。
  2. 下側 55% に黒の縦グラデーション（上端 alpha 0 → 下端 alpha 220）。1px 行ずつ描いてよい。
  3. タイトル: `C:/Windows/Fonts/YuGothB.ttc` 52px、白、左寄せ `x=60`。`draw.textlength` で1文字ずつ測って幅 1080px で折り返し、**最大2行、溢れたら2行目末尾を `…`**。2行目のベースラインが `y=540` 付近になるよう下から積む。
  4. その下 `y=585` 付近に `ARCHITRAVE WORK ｜ 映像制作 あーきとれーぶ`（YuGothB 24px、`#cccccc`）。
  5. `JPEG quality=82, optimize=True`。
- `ogp/` 内で data.js に無い ID の画像は削除する（`ogp/work-*.jpg` に限定）。
- **生成後、作品ページの og:image が `ogp/` を指すよう `generate_work_pages.py` を再実行**（フォールバック判定のため順序が重要）。

正しい実行順:

```bash
python tools/fetch_youtube_meta.py
python tools/make_ogp.py --works
python tools/generate_work_pages.py
```

---

## Phase 4: ローカル検証（全部やってから報告）

サーバーは Claude Code のプレビュー機能で `.claude/launch.json` の **`architrave-portfolio`（port 8736）** を起動する（Bash で `npx serve` を直接起動しない）。

チェックリスト:

1. `python tools/generate_work_pages.py` を2回実行し、2回目で `git status` に差分が出ない（決定的出力）。
2. `work/` が 89 ディレクトリ、`ogp/work-*.jpg` が 89 枚、`sitemap.xml` が 92 URL。
3. 任意の3作品（例: 先頭 `Z-R-cDwceGc`、description にURLが多いもの、タイトルが最長のもの）を `http://localhost:8736/work/<id>/` で開き:
   - CSS・favicon・サムネイルが読み込まれている（console / network にエラー・404 なし）
   - 動画が再生できる、説明文のURLがリンクになっている、改行が保たれている
   - 前後・その他の作品リンク、「作品一覧」（→ トップでモーダルが開く）、「依頼する」（→ contact.html に参照作品が表示される）が動く
   - 375px 幅で横スクロールが出ない
4. JSON-LD: ページ内の `script[type="application/ld+json"]` を `JSON.parse` してエラーが無いこと（javascript_tool で全89ページを fetch して検査するとよい）。
5. OGP画像を3枚、目視確認（タイトルが2行で収まる／`…` が付く／文字が背景に埋もれない）。最長タイトルの作品を必ず含める。
6. トップページ: カードクリックでモーダルが開く、Ctrl+クリックで作品ページが新規タブで開く、役割フィルタ・Enterキー操作・ゲーム（game.js）が従来どおり動く。
7. `python tools/make_ogp.py`（引数なし）で `ogp.jpg` が変化しない（`git status` で確認）。
8. 既存ページ（contact.html / gallery.html）に変化が無い。

---

## Phase 5: 報告（ここで止める。コミットしない）

箇条書きで端的に（スクショの逐次報告は不要。最後にまとめて）:

- 作成・変更したファイル一覧
- 検証チェックリストの結果（1〜8、失敗があれば内容）
- YouTube メタ取得の結果: 成功件数／フォールバック件数／data.js の year と投稿年が食い違う作品の一覧
- Phase 2-3（共有URL変更）を実装したかどうか
- 迷った点・指示書と違う判断をした点

---

## 参考：承認後のデプロイ手順（Opus/ユーザー承認後に実施）

```bash
git add index.html script.js style.css sitemap.xml work ogp tools docs/seo-work-pages-plan.md
git commit   # メッセージ例: "Add per-work pages with VideoObject data, per-work OGP images and full sitemap"
git push origin master

git checkout gh-pages
git checkout master -- index.html script.js style.css sitemap.xml work ogp
git commit -m "Sync from master: per-work pages, OGP images, sitemap"
git push origin gh-pages
git checkout master
```

- **`tools/` と `docs/` は gh-pages に入れない。**
- gh-pages で `work/` から消えた作品がある場合（2回目以降の更新時）は `git rm -r work ogp` してから checkout し直す（古いページが残るため）。

本番確認（反映は1〜2分）:

- `curl -s https://architravework.github.io/architrave/work/<id>/ | findstr og:image`
- https://architravework.github.io/architrave/sitemap.xml が92件
- Google リッチリザルトテスト（https://search.google.com/test/rich-results）で作品ページ1件を検査 → 「動画」と「パンくずリスト」が検出されること
- X の投稿画面に作品ページURLを貼り、作品ごとのOGP画像が出ること

ユーザー作業（任意・手動）:

- Google Search Console に URL プレフィックス `https://architravework.github.io/architrave/` を登録し、`sitemap.xml` を送信

---

## 今後の作品追加フロー（変更後）

`data.js` 編集 → 次の3コマンド → 上記デプロイ手順:

```bash
python tools/fetch_youtube_meta.py
python tools/make_ogp.py --works
python tools/generate_work_pages.py
```

（トップの `ogp.jpg` を更新したい場合のみ `python tools/make_ogp.py` も実行）
