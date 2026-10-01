/**
 * ストア用スクリーンショット撮影のための、シミュレータDBへのダミーデータ投入。
 *
 * 【本番データではない】開発者のシミュレータ上でのみ使う撮影用の道具。
 * まっさらな状態だとカレンダーが空で、アプリの価値が1枚も伝わらないため。
 *
 * 質問文は src/constants/fallbackQuestions.ts の実物を使う。
 * スコアは回答値から axisScore.ts と同じ式で計算して入れるので、
 * アプリが後から再計算しても表示が変わらない。
 *
 *   node scripts/seed-screenshot-data.mjs <kimishidai.db へのパス>
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = process.argv[2];
if (!dbPath) {
  console.error('使い方: node scripts/seed-screenshot-data.mjs <kimishidai.db>');
  process.exit(1);
}

const src = readFileSync(resolve(root, 'src/constants/fallbackQuestions.ts'), 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { FALLBACK_QUESTION_POOL } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);

// 撮影結果を毎回同じにするため、乱数は固定シードの線形合同法で回す
let seed = 20260930;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// axisScore.ts と同じ式
const normalize = (v) => ((Math.min(4, Math.max(1, v)) - 1) / 3) * 100;
const applyPolarity = (n, p) => (p === 'negative' ? 100 - n : n);

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const DAYS = 46; // 当月カレンダーが埋まり、前月にも記録が残る長さ

// 日ごとのメモ。全日に付けると不自然なので、節目だけ
const MEMOS = {
  0: '断れなかった会議を一つ減らせた。言ってみたら意外と平気だった。',
  2: '朝の時間を自分のために使えた日。この感じを続けたい。',
  5: '疲れていたけど、やりたいことを少しだけやれた。',
  9: '人の目が気になった一日。でも気づけただけ前より良い。',
  14: '週末、久しぶりに何も予定を入れなかった。',
  21: '「本当はどうしたい？」と自分に聞く回数が増えてきた気がする。',
};

const lines = ['BEGIN;'];
lines.push(`UPDATE user_preference SET onboarding_completed = 1, interest_themes = ${q(JSON.stringify(['仕事', '人間関係', '将来・キャリア']))};`);
// 撮り直しで積み重ならないよう、先に消す
lines.push('DELETE FROM answer;', 'DELETE FROM question;', 'DELETE FROM daily_entry;', 'DELETE FROM todo;');

const positives = FALLBACK_QUESTION_POOL.filter((x) => x.polarity === 'positive');
const negatives = FALLBACK_QUESTION_POOL.filter((x) => x.polarity === 'negative');

for (let back = DAYS - 1; back >= 0; back--) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - back);
  const date = ymd(d);

  // 記録なしの日を少しだけ混ぜる（皆勤は不自然で、カレンダーの未記録表示も見せたい）
  if (back !== 0 && rand() < 0.16) continue;

  // 使うほど自分軸が戻っていく右肩上がり＋ゆらぎ
  const progress = (DAYS - 1 - back) / (DAYS - 1);
  const p = Math.min(0.97, Math.max(0.12, 0.34 + progress * 0.42 + (rand() - 0.5) * 0.26));

  const entryId = `e-${date}`;
  const at = `${date}T21:${pad(10 + Math.floor(rand() * 40))}:00.000Z`;
  lines.push(
    `INSERT INTO daily_entry (id, date, axis_score, status, created_at, updated_at) VALUES (${q(entryId)}, ${q(date)}, 0, 'completed', ${q(at)}, ${q(at)});`
  );

  // positive 3問 / negative 2問
  const picked = [];
  const take = (pool, n) => {
    for (let i = 0; i < n; i++) picked.push(pool[Math.floor(rand() * pool.length)]);
  };
  take(positives, 3);
  take(negatives, 2);

  let sum = 0;
  picked.forEach((tpl, i) => {
    const base = tpl.polarity === 'positive' ? p : 1 - p;
    const x = Math.min(1, Math.max(0, base + (rand() - 0.5) * 0.3));
    const value = Math.min(4, Math.max(1, Math.round(1 + x * 3)));
    sum += applyPolarity(normalize(value), tpl.polarity);

    const qid = `q-${date}-${i}`;
    lines.push(
      `INSERT INTO question (id, daily_entry_id, text, category, polarity, source, display_order) VALUES (${q(qid)}, ${q(entryId)}, ${q(tpl.text)}, ${q(tpl.category)}, ${q(tpl.polarity)}, 'fallback', ${i});`
    );
    const memo = i === 0 && MEMOS[back] ? q(MEMOS[back]) : 'NULL';
    lines.push(
      `INSERT INTO answer (id, question_id, value, memo, feedback, response_time_seconds, answered_at) VALUES (${q('a-' + date + '-' + i)}, ${q(qid)}, ${value}, ${memo}, NULL, ${8 + Math.floor(rand() * 20)}, ${q(at)});`
    );
  });

  const axis = Math.round(sum / picked.length);
  lines.push(`UPDATE daily_entry SET axis_score = ${axis} WHERE id = ${q(entryId)};`);
}

// 今日のTODO。完了・未完了を混ぜ、「誰のため」の内訳も見えるようにする
const todayStr = ymd(TODAY);
const todos = [
  ['朝の30分を自分の勉強にあてる', 'self', true],
  ['歯医者の予約を取る', 'self', true],
  ['母に電話する', 'family', true],
  ['資料の最終チェック', null, false],
  ['読みかけの本を10ページ', null, false],
];
todos.forEach(([text, doneFor, done], i) => {
  lines.push(
    `INSERT INTO todo (id, date, text, done_for, completed_at, display_order, created_at) VALUES (${q('t-' + i)}, ${q(todayStr)}, ${q(text)}, ${doneFor ? q(doneFor) : 'NULL'}, ${done ? q(todayStr + 'T12:00:00.000Z') : 'NULL'}, ${i}, ${q(todayStr + 'T07:00:00.000Z')});`
  );
});

lines.push('COMMIT;');

execFileSync('sqlite3', [dbPath], { input: lines.join('\n') });

const count = (sql) => execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8' }).trim();
console.log(`投入完了`);
console.log(`  記録した日数: ${count('SELECT COUNT(*) FROM daily_entry')} / ${DAYS}日中`);
console.log(`  回答数: ${count('SELECT COUNT(*) FROM answer')}`);
console.log(`  TODO: ${count('SELECT COUNT(*) FROM todo')}`);
console.log(`  スコア範囲: ${count('SELECT MIN(axis_score) || " 〜 " || MAX(axis_score) FROM daily_entry')}`);
console.log(`  今日: ${count(`SELECT axis_score FROM daily_entry WHERE date = '${todayStr}'`)}`);
