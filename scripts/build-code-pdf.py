#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
コード全文を1冊のPDFにする（表紙・目次・行番号つき）。

  python3 scripts/build-code-pdf.py            # 白黒
  python3 scripts/build-code-pdf.py --color    # 色付き

目次のページ番号は推定ではなく実測する。各ファイルを単体でPDF化して
ページ数を数え、それを積み上げてから目次を作る（Chrome は CSS の
target-counter に未対応で、組版結果からページ番号を取れないため）。
その分 Chrome を人数分起動するので、65ファイルで40秒ほどかかる。

出力先 dist/ は .gitignore 済み。生成物はリポジトリに入れない。
"""
import argparse, glob, html, io, json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Phase 1 で整理した5層の順に並べる（上から下へ読める）
LAYERS = [
    ("① 画面（Expo Router）",    ["app"]),
    ("② 部品（components）",     ["src/components"]),
    ("③ フック（hooks）",        ["src/hooks"]),
    ("④ サービス（services）",   ["src/services"]),
    ("⑤ リポジトリ・DB（db）",   ["src/db"]),
    ("定数・型・ユーティリティ", ["src/constants", "src/types", "src/lib"]),
]

KEYWORDS = set("""export function return const let var if else for while do import from
type interface async await new class extends implements default null undefined true false
this typeof instanceof continue break switch case try catch finally throw satisfies as of in
enum namespace readonly public private protected static get set yield delete void""".split())
TYPES = set("""string number boolean void any unknown never object symbol bigint
Promise Array Map Set Date Record Partial Required Readonly Pick Omit
TextStyle ViewStyle React JSX""".split())

TOKEN = re.compile(r"""
   (?P<comment>//[^\n]*|/\*.*?\*/)
 | (?P<string>'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)
 | (?P<number>\b\d+(?:\.\d+)?\b)
 | (?P<ident>[A-Za-z_$][\w$]*)
 | (?P<other>.)
""", re.X | re.S)


def classify(m):
    if m.lastgroup == 'ident':
        t = m.group()
        return 'kw' if t in KEYWORDS else ('ty' if t in TYPES else None)
    return {'comment': 'cm', 'string': 'st', 'number': 'nu'}.get(m.lastgroup)


def highlight(src):
    """トークンに span を付ける。改行をまたぐトークンは行ごとに閉じる
    （1行1<tr>で組むので、span が行をまたぐと表が壊れるため）。"""
    out = []
    for m in TOKEN.finditer(src):
        cls, text = classify(m), m.group()
        if cls is None:
            out.append(html.escape(text))
        else:
            out.append('\n'.join(
                f'<span class="{cls}">{html.escape(p)}</span>' if p else ''
                for p in text.split('\n')))
    return ''.join(out)


def collect():
    seen, groups = set(), []
    for label, roots in LAYERS:
        files = []
        for root in roots:
            for ext in ("ts", "tsx"):
                files += glob.glob(os.path.join(ROOT, root, "**", f"*.{ext}"), recursive=True)
        files = sorted(os.path.relpath(f, ROOT) for f in files)
        files = [f for f in files if f not in seen]
        seen.update(files)
        if files:
            groups.append((label, files))
    return groups


def css(color):
    palette = """
.kw { color: #7F0055; font-weight: 600; }
.ty { color: #116644; }
.st { color: #A31515; }
.nu { color: #0B7285; font-weight: 500; }
.cm { color: #3F7A2E; font-style: italic; }""" if color else """
.kw, .ty, .st, .nu, .cm { color: #1a1a1a; font-weight: 400; font-style: normal; }"""
    return """
@page { size: A4; margin: 11mm 11mm; }
html, body { margin: 0; padding: 0; }
body { font-family: "SFMono-Regular", Menlo, Consolas, monospace;
       font-size: 8pt; line-height: 1.3; color: #1a1a1a; }
h1.file { font-family: -apple-system, "Hiragino Sans", sans-serif;
          font-size: 9.5pt; line-height: 1.2; margin: 0 0 1pt; color: #111; }
.meta { font-family: -apple-system, "Hiragino Sans", sans-serif;
        font-size: 7pt; line-height: 1.2; color: #777; margin: 0 0 4pt;
        padding-bottom: 2pt; border-bottom: .4pt solid #ccc; }
table.code { border-collapse: collapse; width: 100%; table-layout: fixed; }
table.code td { font-size: 8pt; line-height: 1.3; padding: 0; }
td.ln { width: 24pt; text-align: right; padding-right: 7pt; color: #aaa;
        vertical-align: top; border-right: .4pt solid #e2e2e2; }
td.src { padding-left: 7pt; white-space: pre-wrap; word-break: break-word;
         vertical-align: top; }
section { page-break-before: always; }
.cover { page-break-after: always; padding-top: 70mm; text-align: center; }
.cover h1 { font-family: -apple-system, "Hiragino Sans", sans-serif;
            font-size: 26pt; margin: 0 0 6pt; letter-spacing: .04em; }
.cover .sub { font-family: -apple-system, "Hiragino Sans", sans-serif;
              font-size: 11pt; color: #555; margin: 0 0 40pt; }
.cover dl { display: inline-block; text-align: left; font-size: 9pt; color: #333; }
.cover dt { font-family: -apple-system, "Hiragino Sans", sans-serif;
            color: #888; font-size: 7.5pt; margin-top: 10pt; }
.toc { page-break-after: always; }
.toc h2 { font-family: -apple-system, "Hiragino Sans", sans-serif;
          font-size: 13pt; margin: 0 0 10pt; }
.toc h3 { font-family: -apple-system, "Hiragino Sans", sans-serif;
          font-size: 8.5pt; color: #666; margin: 11pt 0 3pt;
          padding-bottom: 2pt; border-bottom: .4pt solid #ddd; }
.toc ol { list-style: none; margin: 0; padding: 0; }
.toc li { display: flex; align-items: baseline; font-size: 8pt; line-height: 1.65; }
.toc .dots { flex: 1; border-bottom: .4pt dotted #bbb; margin: 0 4pt 2pt; }
.toc .pg { color: #555; font-variant-numeric: tabular-nums; }
""" + palette


def rows(path):
    src = io.open(os.path.join(ROOT, path), encoding='utf-8').read().rstrip('\n')
    return ''.join(
        f'<tr><td class="ln">{i}</td><td class="src">{line or "&nbsp;"}</td></tr>'
        for i, line in enumerate(highlight(src).split('\n'), 1))


def section(path, commit):
    return (f'<section><h1 class="file">{html.escape(path)}</h1>'
            f'<p class="meta">キミシダイ日記 &middot; {commit}</p>'
            f'<table class="code">{rows(path)}</table></section>')


def page(body, color):
    return (f'<!doctype html><html lang="ja"><head><meta charset="utf-8">'
            f'<style>{css(color)}</style></head><body>{body}</body></html>')


def to_pdf(html_path, pdf_path):
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}",
                    f"file://{html_path}"], capture_output=True)
    d = open(pdf_path, 'rb').read()
    return len(re.findall(rb'/Type\s*/Page[^s]', d))


def git_commit():
    def run(*a):
        return subprocess.run(a, cwd=ROOT, capture_output=True, text=True).stdout.strip()
    h = run("git", "rev-parse", "--short", "HEAD") or "unknown"
    return h + ("-dirty" if run("git", "status", "--porcelain") else "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--color", action="store_true", help="シンタックスハイライトを付ける")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    if not os.path.exists(CHROME):
        sys.exit("Google Chrome が見つかりません: " + CHROME)

    commit = git_commit()
    groups = collect()
    work = os.path.join(ROOT, "dist", ".work")
    os.makedirs(work, exist_ok=True)

    n_files = sum(len(f) for _, f in groups)
    n_lines = sum(len(io.open(os.path.join(ROOT, f), encoding='utf-8').read().splitlines())
                  for _, fs in groups for f in fs)
    print(f"対象 {n_files} ファイル / {n_lines:,} 行 / コミット {commit}")

    # ── ページ数の実測 ──
    t0, counts = time.time(), {}
    for _, files in groups:
        for f in files:
            h, p = os.path.join(work, "m.html"), os.path.join(work, "m.pdf")
            io.open(h, 'w', encoding='utf-8').write(page(section(f, commit), args.color))
            counts[f] = to_pdf(h, p)
    print(f"ページ数を実測: 本文 {sum(counts.values())} ページ（{time.time()-t0:.0f}秒）")

    # ── 目次の厚みを確定させる（表紙1 + 目次N） ──
    for toc_pages in (1, 2, 3, 4):
        front = 1 + toc_pages
        pagemap, cur = {}, front + 1
        for _, files in groups:
            for f in files:
                pagemap[f] = cur
                cur += counts[f]
        total = cur - 1

        cover = (f'<div class="cover"><h1>キミシダイ日記</h1>'
                 f'<p class="sub">ソースコード全文</p><dl>'
                 f'<dt>リポジトリ</dt><dd>my_own_path_diary</dd>'
                 f'<dt>コミット</dt><dd>{commit}</dd>'
                 f'<dt>構成</dt><dd>{n_files} ファイル / {n_lines:,} 行 / 全 {total} ページ</dd>'
                 f'<dt>技術</dt><dd>React Native (Expo SDK 57) + TypeScript + SQLite</dd>'
                 f'</dl></div>')
        toc = ['<div class="toc"><h2>目次</h2>']
        for label, files in groups:
            toc.append(f'<h3>{html.escape(label)}</h3><ol>')
            for f in files:
                toc.append(f'<li><span>{html.escape(f)}</span><span class="dots"></span>'
                           f'<span class="pg">{pagemap[f]}</span></li>')
            toc.append('</ol>')
        toc.append('</div>')
        body = cover + ''.join(toc) + ''.join(
            section(f, commit) for _, files in groups for f in files)

        hp = os.path.join(work, "book.html")
        io.open(hp, 'w', encoding='utf-8').write(page(body, args.color))
        out = args.out or os.path.join(
            ROOT, "dist", f"キミシダイ日記_コード全文_{commit}{'_色付き' if args.color else ''}.pdf")
        actual = to_pdf(hp, out)
        if actual == total:
            print(f"完成: {out}")
            print(f"  {actual} ページ（表紙1 + 目次{toc_pages} + 本文{sum(counts.values())}）"
                  f" / {os.path.getsize(out)/1024/1024:.1f} MB")
            return
    sys.exit("目次のページ数が収束しませんでした")


if __name__ == "__main__":
    main()
