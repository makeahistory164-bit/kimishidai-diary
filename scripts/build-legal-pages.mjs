/**
 * 利用規約・プライバシーポリシーの公開HTMLを生成する。
 *
 * 出典は src/constants/legalDocuments.ts ただ一つ。
 * アプリ内表示と公開ページの文面がズレると、ストア審査でもユーザー対応でも
 * 事故になるため、公開HTMLを手書きせずここから生成する。
 * 文言を直すときは legalDocuments.ts を直して、このスクリプトを再実行すること。
 *
 *   node scripts/build-legal-pages.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'legal-site');

// TSのまま読めないので、型を落としてESMに変換してから動的importする
const source = readFileSync(resolve(root, 'src/constants/legalDocuments.ts'), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { TERMS_DOCUMENT, PRIVACY_POLICY_DOCUMENT } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const APP_NAME = 'キミシダイ日記';

function renderSection(section) {
  const body = section.body.map((p) => `        <p>${esc(p)}</p>`).join('\n');
  const bullets = section.bullets
    ? '\n        <ul>\n' +
      section.bullets.map((b) => `          <li>${esc(b)}</li>`).join('\n') +
      '\n        </ul>'
    : '';
  return `      <section>
        <h2>${esc(section.title)}</h2>
${body}${bullets}
      </section>`;
}

function renderPage(doc, { otherHref, otherLabel }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)} | ${esc(APP_NAME)}</title>
<meta name="description" content="${esc(APP_NAME)}の${esc(doc.title)}です。${esc(doc.intro)}">
<style>
  :root {
    color-scheme: light dark;
    --bg: #f7f7f5;
    --surface: #ffffff;
    --text: #1d1d1b;
    --muted: #6b6b66;
    --border: #e2e2dd;
    --accent: #2f7a53;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17181a;
      --surface: #1f2123;
      --text: #ececea;
      --muted: #a2a29c;
      --border: #323437;
      --accent: #6cbf90;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    line-height: 1.9;
    font-size: 16px;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 48px 16px 80px; }
  header { margin-bottom: 32px; }
  .app { font-size: 14px; color: var(--accent); font-weight: 700; letter-spacing: .04em; margin: 0 0 8px; }
  h1 { font-size: 28px; line-height: 1.4; margin: 0 0 12px; letter-spacing: .01em; }
  .updated { font-size: 13px; color: var(--muted); margin: 0; }
  .intro {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    margin: 24px 0 8px;
    font-size: 15px;
  }
  section { margin-top: 36px; }
  h2 { font-size: 18px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  p { margin: 0 0 14px; }
  ul { margin: 0 0 14px; padding-left: 1.3em; }
  li { margin-bottom: 8px; }
  footer {
    margin-top: 56px; padding-top: 24px;
    border-top: 1px solid var(--border);
    font-size: 14px; color: var(--muted);
    display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between;
  }
  a { color: var(--accent); }
  @media (max-width: 480px) {
    .wrap { padding: 32px 16px 64px; }
    h1 { font-size: 23px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <p class="app">${esc(APP_NAME)}</p>
      <h1>${esc(doc.title)}</h1>
      <p class="updated">最終更新日: ${esc(doc.lastUpdated)}</p>
    </header>
    <p class="intro">${esc(doc.intro)}</p>
    <main>
${doc.sections.map(renderSection).join('\n')}
    </main>
    <footer>
      <a href="${otherHref}">${esc(otherLabel)}</a>
      <span>${esc(APP_NAME)}</span>
    </footer>
  </div>
</body>
</html>
`;
}

// ルートURLが404やディレクトリ一覧にならないよう、両文書へのハブページも置く
function renderIndex() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(APP_NAME)}</title>
<meta name="description" content="${esc(APP_NAME)}の利用規約とプライバシーポリシーです。">
<style>
  :root { color-scheme: light dark; --bg:#f7f7f5; --surface:#fff; --text:#1d1d1b; --muted:#6b6b66; --border:#e2e2dd; --accent:#2f7a53; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#17181a; --surface:#1f2123; --text:#ececea; --muted:#a2a29c; --border:#323437; --accent:#6cbf90; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); line-height:1.9; font-size:16px;
    font-family:-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; }
  .wrap { max-width:640px; margin:0 auto; padding:64px 16px 80px; }
  h1 { font-size:28px; margin:0 0 12px; }
  .lead { color:var(--muted); font-size:15px; margin:0 0 36px; }
  .links { display:grid; gap:12px; }
  .card { display:block; background:var(--surface); border:1px solid var(--border);
    border-radius:12px; padding:18px 20px; text-decoration:none; color:var(--text); }
  .card:hover { border-color:var(--accent); }
  .card strong { display:block; font-size:16px; margin-bottom:4px; }
  .card span { font-size:13px; color:var(--muted); }
  @media (max-width:480px) { .wrap { padding:40px 16px 64px; } h1 { font-size:23px; } }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${esc(APP_NAME)}</h1>
    <p class="lead">自分軸で過ごせたかを毎日振り返る日記アプリです。</p>
    <div class="links">
      <a class="card" href="./privacy.html">
        <strong>プライバシーポリシー</strong>
        <span>扱うデータと、その使い方について</span>
      </a>
      <a class="card" href="./terms.html">
        <strong>利用規約</strong>
        <span>ご利用にあたっての約束ごと</span>
      </a>
    </div>
  </div>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'index.html'), renderIndex());
writeFileSync(
  resolve(outDir, 'privacy.html'),
  renderPage(PRIVACY_POLICY_DOCUMENT, { otherHref: './terms.html', otherLabel: '利用規約' })
);
writeFileSync(
  resolve(outDir, 'terms.html'),
  renderPage(TERMS_DOCUMENT, { otherHref: './privacy.html', otherLabel: 'プライバシーポリシー' })
);
console.log('generated: legal-site/privacy.html, legal-site/terms.html');
