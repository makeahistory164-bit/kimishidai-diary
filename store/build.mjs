/**
 * ストア素材（App Storeスクリーンショット・アプリアイコン）のビルドスクリプト。
 *
 * デザイン出典: Claude Design プロジェクト「App Store素材案提示」
 *   - アイコン: 案 7a「緑のドット絵 — ノートの継ぎ目＋16×16ピクセルの人」
 *   - スクリーンショット: ターン9のレイアウト（見出し＋キャラ＋端末）
 *
 * 【重要】端末内に描くUIは、デザイン案のモックではなく「実装済みのアプリUI」を再現している。
 * デザイン案は回答UIを5色スウォッチで描いていたが、これは設計判断3-3
 * （回答UIに色のヒントを出さない＝正直な自己申告を歪めないため）と衝突する。
 * またApp Storeはスクリーンショットが実際のアプリを反映することを求めるため、
 * 端末内は AnswerScale.tsx / CalendarGrid.tsx / onboarding の実装に合わせてある。
 *
 * 使い方: node store/build.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'store/out');
const HTML_DIR = join(OUT, 'html');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ── 配色 ────────────────────────────────────────────────
// Modernist（ストア素材の地）
const M = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201e1d',
  accent700: '#ae1800',
  accent400: '#ff9783',
};
// アプリ実装の配色（src/constants/colors.ts と一致させること）
const APP = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E5E5EA',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B70',
  accent: '#3A3A3C',
};
// カレンダー5段階（colors.ts の CALENDAR_STAGE_COLORS と一致）
const STAGE = ['#D9482F', '#EF8460', '#D8D8DE', '#7CBE8C', '#1F7A45'];

// キャラの緑（デザイン案より）
const CHAR_DARK = '#2f6f4f';
const CHAR_LIGHT = '#93a94e';

const FONT_JP = `'Hiragino Sans','Noto Sans JP','Yu Gothic',system-ui,sans-serif`;
const FONT_LATIN = `'Archivo','Helvetica Neue',system-ui,sans-serif`;

// ── アイコン（アプリ内キャラと同じバストアップ）─────────────
/**
 * ★ここの座標は src/components/Mascot.tsx の EXPRESSIONS と同一にすること。
 * ホーム画面のアイコンとアプリ内のキャラが別物に見えてしまうため、
 * 片方だけ変更してはいけない。1マス = 14.75（236 / 16マス）。
 */
const CELL = 14.75;
const MASCOT_HEAD = [3, 2, 10, 8];
const MASCOT_NECK = [7, 10, 2, 1];
const MASCOT_SHOULDER = [2, 11, 12, 5];

const MASCOT_EXPRESSIONS = {
  joy: {
    body: CHAR_LIGHT,
    shoulder: MASCOT_SHOULDER,
    cuts: [
      [5, 5, 2, 2],
      [9, 5, 2, 2],
      [5, 7, 1, 1],
      [10, 7, 1, 1],
      [6, 8, 4, 1],
    ],
    accent: { color: CHAR_DARK, cells: [[4, 7, 1, 1], [11, 7, 1, 1]] },
  },
  cheer: {
    body: CHAR_DARK,
    shoulder: [2, 11, 13, 5],
    extra: [[14, 8, 1, 3]],
    cuts: [
      [5, 5, 2, 2],
      [9, 5, 2, 2],
      [6, 8, 4, 1],
    ],
  },
};

/** マス座標 [x,y,w,h] を236座標系のrectへ */
function cellRect([x, y, w, h], fill) {
  return `<rect x="${x * CELL}" y="${y * CELL}" width="${w * CELL}" height="${h * CELL}" fill="${fill}"></rect>`;
}

function mascotParts(expression) {
  const spec = MASCOT_EXPRESSIONS[expression];
  return [MASCOT_HEAD, MASCOT_NECK, spec.shoulder, ...(spec.extra ?? [])];
}

function mascotRects(expression, { bodyColor, cutColor = M.bg, includeAccent = true } = {}) {
  const spec = MASCOT_EXPRESSIONS[expression];
  return `<g shape-rendering="crispEdges">
    ${mascotParts(expression).map((c) => cellRect(c, bodyColor ?? spec.body)).join('')}
    ${spec.cuts.map((c) => cellRect(c, cutColor)).join('')}
    ${includeAccent && spec.accent ? spec.accent.cells.map((c) => cellRect(c, spec.accent.color)).join('') : ''}
  </g>`;
}

/** ノートの継ぎ目を思わせる格子。マス=一日 */
function gridPattern(id, stroke, opacity) {
  return `<pattern id="${id}" width="14.75" height="14.75" patternUnits="userSpaceOnUse">
    <path d="M14.75 0V14.75H0" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.5"></path>
  </pattern>`;
}

/** アイコンに使う表情。深緑のcheerは淡緑のjoyより地との明度差が大きく、小さい表示でも潰れない */
const ICON_EXPRESSION = 'cheer';

/** バストは肩が下端まで届く絵柄なので、そのまま置くとiOSの角丸マスクで肩の角が欠ける。
 *  絵の中心を箱の中心に合わせたうえで少し縮め、マスクに触れないようにする。 */
function mascotTransform(expression, scale) {
  const parts = mascotParts(expression);
  const minX = Math.min(...parts.map((c) => c[0]));
  const maxX = Math.max(...parts.map((c) => c[0] + c[2]));
  const minY = Math.min(...parts.map((c) => c[1]));
  const maxY = Math.max(...parts.map((c) => c[1] + c[3]));
  const cx = ((minX + maxX) / 2) * CELL;
  const cy = ((minY + maxY) / 2) * CELL;
  return `translate(${118 - cx * scale}, ${118 - cy * scale}) scale(${scale})`;
}

function iconSvg({
  size,
  expression = ICON_EXPRESSION,
  withBackground = true,
  withGrid = true,
  monochrome = false,
  scale = 0.82,
}) {
  const transform = mascotTransform(expression, scale);

  // Androidのテーマアイコンはアルファチャンネルだけを見て塗り直すため、
  // 目や口を白で塗ると「穴」ではなく本体として扱われ、顔が潰れて消える。
  // マスクで実際に透明な穴を開ける必要がある。
  if (monochrome) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236 236" width="${size}" height="${size}">
  <defs><mask id="mono">
    <g transform="${transform}">
      ${mascotRects(expression, { bodyColor: '#ffffff', cutColor: '#000000', includeAccent: false })}
    </g>
  </mask></defs>
  <rect width="236" height="236" fill="#000000" mask="url(#mono)"></rect>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236 236" width="${size}" height="${size}">
  <defs>${gridPattern('grid', CHAR_LIGHT, '.55')}</defs>
  ${withBackground ? `<rect width="236" height="236" fill="${M.bg}"></rect>` : ''}
  ${withGrid ? `<rect width="236" height="236" fill="url(#grid)"></rect>` : ''}
  <g transform="${transform}">
    ${mascotRects(expression)}
  </g>
</svg>`;
}

// ── ストア用キャラ（顔＋上半身）────────────────────────────
function mascot({ size, color, cut, variant }) {
  const eyes =
    variant === 'closed'
      ? `<rect x="73.75" y="88.5" width="29.5" height="14.75"></rect><rect x="132.75" y="88.5" width="29.5" height="14.75"></rect><rect x="103.25" y="118" width="14.75" height="14.75"></rect>`
      : variant === 'smile'
        ? `<rect x="73.75" y="73.75" width="29.5" height="29.5"></rect><rect x="132.75" y="73.75" width="29.5" height="29.5"></rect>
           <rect x="73.75" y="103.25" width="14.75" height="14.75"></rect><rect x="147.5" y="103.25" width="14.75" height="14.75"></rect>
           <rect x="88.5" y="118" width="59" height="14.75"></rect>`
        : `<rect x="73.75" y="73.75" width="29.5" height="29.5"></rect><rect x="132.75" y="73.75" width="29.5" height="29.5"></rect><rect x="103.25" y="118" width="29.5" height="14.75"></rect>`;
  return `<svg viewBox="0 0 236 236" width="${size}" height="${size}" shape-rendering="crispEdges" style="flex:none">
    <g fill="${color}">
      <rect x="44.25" y="29.5" width="147.5" height="118"></rect>
      <rect x="103.25" y="147.5" width="29.5" height="14.75"></rect>
      <rect x="29.5" y="162.25" width="177" height="73.75"></rect>
    </g>
    <g fill="${cut}">${eyes}</g>
  </svg>`;
}

// ── iPhone フレーム（402×874pt 相当）──────────────────────
function phone(inner) {
  return `<div style="width:402px;height:874px;background:${M.text};border-radius:56px;padding:11px;box-shadow:0 8px 30px rgba(0,0,0,.35);flex:none">
    <div style="position:relative;width:100%;height:100%;border-radius:45px;overflow:hidden;background:${APP.background}">
      <div style="position:absolute;top:11px;left:50%;transform:translateX(-50%);width:118px;height:33px;border-radius:20px;background:#000;z-index:5"></div>
      ${inner}
    </div>
  </div>`;
}

// ── 実アプリ画面の再現 ────────────────────────────────────
/** 今日の質問（QuestionCard.tsx + AnswerScale.tsx の実装どおり） */
function screenQuestion() {
  const opt = (label, selected) =>
    `<div style="flex-grow:1;flex-basis:47%;padding:12px 10px;border-radius:10px;border:1px solid ${
      selected ? APP.accent : APP.border
    };background:${selected ? APP.accent : APP.surface};text-align:center;font-size:13px;${
      selected ? `color:#fff;font-weight:600` : `color:${APP.textPrimary}`
    }">${label}</div>`;
  return `<div style="height:100%;padding:64px 20px 0;display:flex;flex-direction:column;gap:16px">
    <div style="font-size:13px;color:${APP.textSecondary}">8月28日</div>
    <div style="background:${APP.surface};border-radius:16px;padding:20px;border:1px solid ${APP.border};display:flex;flex-direction:column;gap:14px">
      <div style="font-size:12px;color:${APP.textSecondary}">1 / 5</div>
      <div style="font-size:18px;font-weight:600;color:${APP.textPrimary};line-height:26px">今日、自分の意思で選んだ行動はあった？</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${opt('そう思わない', false)}${opt('あまり思わない', false)}${opt('やや思う', true)}${opt('そう思う', false)}
      </div>
      <div style="border:1px solid ${APP.border};border-radius:10px;padding:12px;min-height:44px;font-size:14px;color:${APP.textSecondary}">一言メモ（任意）</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:12px;color:${APP.textSecondary}">この質問はどうでしたか？</div>
        <div style="display:flex;gap:8px;font-size:15px">👍 👎</div>
      </div>
    </div>
    <div style="background:${APP.surface};border-radius:16px;padding:20px;border:1px solid ${APP.border};display:flex;flex-direction:column;gap:14px;opacity:.55">
      <div style="font-size:12px;color:${APP.textSecondary}">2 / 5</div>
      <div style="font-size:18px;font-weight:600;color:${APP.textPrimary};line-height:26px">今日、誰かの顔色をうかがって決めたことはあった？</div>
    </div>
    <div style="background:${APP.surface};border-radius:16px;padding:20px;border:1px solid ${APP.border};display:flex;flex-direction:column;gap:14px;opacity:.28">
      <div style="font-size:12px;color:${APP.textSecondary}">3 / 5</div>
      <div style="font-size:18px;font-weight:600;color:${APP.textPrimary};line-height:26px">今日使ったお金は、自分が本当に納得した使い方だった？</div>
    </div>
  </div>`;
}

/** カレンダー（CalendarGrid.tsx / colors.ts の5段階配色どおり）。2026年8月は土曜始まり */
function screenCalendar() {
  const scores = [
    4, 3, 2, 4, 3, 1, 4, 3, 4, 2, 0, 3, 4, 3, 2, 4, 4, 1, 3, 4, 2, 3, 4, 3, 4, 2, 4, 3,
  ];
  let cells = '';
  for (let i = 0; i < 6; i++) cells += `<div></div>`; // 8/1は土曜
  for (let d = 1; d <= 31; d++) {
    const s = scores[d - 1];
    const filled = d <= 28;
    cells += `<div style="aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;${
      filled
        ? `background:${STAGE[s]};color:${s === 2 ? '#1C1C1E' : '#fff'}`
        : `color:#C7C7CC`
    }">${d}</div>`;
  }
  const legend = STAGE.map(
    (c) => `<div style="width:34px;height:9px;border-radius:5px;background:${c}"></div>`
  ).join('');
  return `<div style="height:100%;padding:64px 18px 0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:6px">
      <div style="position:absolute;left:0;font-size:20px;color:${APP.textPrimary}">‹</div>
      <div style="font-size:19px;font-weight:700;color:${APP.textPrimary}">2026年 8月</div>
    </div>
    <div style="text-align:center;font-size:12px;color:${APP.textSecondary};margin-bottom:14px">無料プランでは直近3ヶ月分を閲覧できます</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:7px;font-size:11px;color:${APP.textSecondary};text-align:center;margin-bottom:8px">
      <div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:7px">${cells}</div>
    <div style="margin-top:26px;display:flex;align-items:center;gap:7px;font-size:10.5px;color:${APP.textSecondary}">
      <span style="white-space:nowrap">軸がブレた日</span>${legend}<span style="white-space:nowrap">自分軸を保てた日</span>
    </div>
  </div>`;
}

/** 端末内保存の説明（onboarding の StepHowItWorks の実文言・実レイアウト） */
function screenPrivacy() {
  const p = (t) =>
    `<div style="font-size:15px;line-height:24px;color:${APP.textPrimary}">${t}</div>`;
  // 実装どおり、上部に3つのドット（現在地は幅20pxのアクセント色）
  const dot = (active) =>
    `<div style="width:${active ? 20 : 8}px;height:8px;border-radius:4px;background:${
      active ? APP.accent : APP.border
    }"></div>`;
  return `<div style="height:100%;padding:60px 0 0;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px">
      ${dot(false)}${dot(true)}${dot(false)}
    </div>
    <div style="padding:0 24px;display:flex;flex-direction:column;gap:16px">
      <div style="font-size:24px;font-weight:700;color:${APP.textPrimary}">使い方・安心感について</div>
      ${p('毎日、日替わりの質問を5問お届けします。答えは4段階評価と、書きたければ一言メモだけ。1日3分ほどで終わります。')}
      ${p('質問は100問以上の中から、最近お見せしていないものを選んでいます。同じ質問が続いて形だけの振り返りにならないようにするためです。')}
      ${p('書いた内容は、すべてこの端末の中だけに保存されます。外部に送信することはありません。アカウント登録も不要です。')}
    </div>
    <div style="margin-top:28px;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:14px;color:${APP.textSecondary}">スキップ</div>
      <div style="background:${APP.accent};color:#fff;font-size:15px;font-weight:600;padding:14px 34px;border-radius:12px">次へ</div>
    </div>
  </div>`;
}

// ── スクリーンショット組み立て ────────────────────────────
function shot({ no, kicker, headline, dark, mascotSvg, screen }) {
  const fg = dark ? '#ffffff' : M.text;
  const kickerColor = dark ? M.accent400 : M.accent700;
  const rule = dark ? 'rgba(255,255,255,.4)' : 'rgba(32,30,29,.4)';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1290px;height:2796px;overflow:hidden;background:${M.text}}
  .scale{transform:scale(3);transform-origin:top left;width:430px;height:932px}
  .shot{width:430px;height:932px;position:relative;overflow:hidden;background:${dark ? M.text : M.text};font-family:${FONT_JP}}
  h2{font-size:34px;line-height:1.15;letter-spacing:-.015em;font-weight:800;color:${fg}}
  </style></head><body><div class="scale"><div class="shot">
    <div style="background:${dark ? M.text : M.bg};padding:44px 32px 26px">
      <div style="display:flex;align-items:center;gap:10px;color:${kickerColor};font:800 11px ${FONT_LATIN};letter-spacing:.16em">
        ${no}<span style="width:22px;height:2px;background:${rule};display:inline-block"></span>${kicker}
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;margin-top:12px">
        <h2 style="flex:1">${headline}</h2>
        ${mascotSvg}
      </div>
    </div>
    <div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center">
      ${phone(screen)}
    </div>
  </div></div></body></html>`;
}

// ── 出力定義 ────────────────────────────────────────────
const pages = [
  {
    name: 'screenshot-01-question',
    w: 1290,
    h: 2796,
    html: shot({
      no: '01',
      kicker: '問いかけ',
      headline: 'きょうの問いが、<br>毎日届く',
      dark: false,
      mascotSvg: mascot({ size: 78, color: CHAR_DARK, cut: M.bg, variant: 'open' }),
      screen: screenQuestion(),
    }),
  },
  {
    name: 'screenshot-02-calendar',
    w: 1290,
    h: 2796,
    html: shot({
      no: '02',
      kicker: '記録',
      headline: '答えた色が、<br>あなたの形になる',
      dark: false,
      mascotSvg: mascot({ size: 78, color: CHAR_LIGHT, cut: M.bg, variant: 'smile' }),
      screen: screenCalendar(),
    }),
  },
  {
    name: 'screenshot-03-privacy',
    w: 1290,
    h: 2796,
    html: shot({
      no: '03',
      kicker: 'まもる',
      // 34pxでは1行8文字までしか収まらないため、行あたり7文字に抑えている
      headline: '書いたことは、<br>ここから出ない',
      dark: true,
      mascotSvg: mascot({ size: 78, color: CHAR_LIGHT, cut: M.text, variant: 'closed' }),
      screen: screenPrivacy(),
    }),
  },
];

// アイコン各種
const icons = [
  { name: 'icon', size: 1024, opts: {}, transparent: false },
  {
    name: 'android-icon-foreground',
    size: 1024,
    // Android アダプティブは外周が切り取られるため、安全領域(中央66%)まで縮める
    opts: { withBackground: false, withGrid: false, scale: 0.62 },
    transparent: true,
  },
  {
    name: 'android-icon-background',
    size: 1024,
    opts: { onlyBackground: true },
    transparent: false,
  },
  {
    name: 'android-icon-monochrome',
    size: 1024,
    opts: { withBackground: false, withGrid: false, monochrome: true, scale: 0.62 },
    transparent: true,
  },
  { name: 'favicon', size: 64, opts: {}, transparent: false },
];

function iconPage(size, opts) {
  const svg = opts.onlyBackground
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236 236" width="${size}" height="${size}">
         <defs>${gridPattern('grid', CHAR_LIGHT, '.55')}</defs>
         <rect width="236" height="236" fill="${M.bg}"></rect>
         <rect width="236" height="236" fill="url(#grid)"></rect>
       </svg>`
    : iconSvg({ size, ...opts });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}
  </style></head><body>${svg}</body></html>`;
}

// ── 実行 ────────────────────────────────────────────────
mkdirSync(HTML_DIR, { recursive: true });

function render(name, html, w, h, transparent) {
  const htmlPath = join(HTML_DIR, `${name}.html`);
  writeFileSync(htmlPath, html);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${w},${h}`,
    `--screenshot=${join(OUT, `${name}.png`)}`,
  ];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(`file://${htmlPath}`);
  execFileSync(CHROME, args, { stdio: 'pipe' });
  console.log(`  ✓ ${name}.png (${w}×${h})`);
}

console.log('アイコンを生成中...');
for (const i of icons) render(i.name, iconPage(i.size, i.opts), i.size, i.size, i.transparent);

console.log('スクリーンショットを生成中...');
for (const p of pages) render(p.name, p.html, p.w, p.h, false);

console.log('アイコンを assets/ へ配置...');
for (const n of [
  'icon',
  'android-icon-foreground',
  'android-icon-background',
  'android-icon-monochrome',
  'favicon',
]) {
  copyFileSync(join(OUT, `${n}.png`), join(ROOT, 'assets', `${n}.png`));
  console.log(`  ✓ assets/${n}.png`);
}

console.log('\n完了: store/out/ に出力しました。');
