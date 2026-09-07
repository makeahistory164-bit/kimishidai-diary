# キミシダイ日記 学習ロードマップ

対象: プログラミング初心者 / 目標: このアプリを「自分の言葉で説明でき、バグを自力で直せる」状態にして就職ポートフォリオにする
作成日: 2026-09-06

---

## このロードマップの考え方

初心者がやりがちな失敗は「React入門書を1冊読んでから自分のコードを見る」順番です。
これは遠回りになります。理由は、入門書のサンプルと実際のアプリはコードの形が違いすぎて、
知識が目の前のコードに接続しないからです。

このロードマップは逆の順番を取ります。

> **自分のアプリの中で起きている実際の動きを1本追いかけ、
> そこで出てきた分からない言葉だけを学ぶ。**

覚える対象が「自分が作ったものの中にある」ので、記憶に残り、面接でも喋れます。

### 全体像（所要の目安: 週10時間で約9〜10週間）

| Phase | テーマ | 目安 | ここで得られる力 |
|---|---|---|---|
| 0 | 環境と観測手段を整える | 3日 | 動かせる・中を覗ける |
| 1 | アプリ全体の地図を持つ | 1週 | どこに何があるか言える |
| 2 | 1機能を縦に貫通させる | 1週 | **データの流れを追える（最重要）** |
| 3 | React の考え方 | 2週 | 画面が更新される仕組みが分かる |
| 4 | データ層（SQLite） | 1週 | 保存の仕組みが分かる |
| 5 | 非同期処理 | 1週 | async/await でつまずかない |
| 6 | デバッグ技術 | 1週 | **バグを自力で直せる（不安の解消）** |
| 7 | 自分で機能を1つ足す | 1週 | 「作れる」と言える |
| 8 | ポートフォリオ化 | 1週 | 面接で戦える |

---

## Phase 0: 環境と観測手段を整える（3日）

「画面上で何が行われているか分からない」の半分は、**見る道具がない**ことが原因です。
学習を始める前に、中身を覗ける状態を作ります。

### 0-1. まず Git を入れる ★最優先

現在このプロジェクトは Git リポジトリになっていません（`.git` がない）。
これは2つの意味で致命的です。

1. **学習面**: 壊しても戻せない。壊せないコードは学習教材になりません。
   逆に「いつでも戻せる」と分かった瞬間、実験し放題になります。
2. **就職面**: 採用担当が最初に見るのは GitHub のコミット履歴です。
   「どう作ったか」の過程が見えないコードは、評価対象になりにくいのが実情です。

```bash
cd ~/自作アプリ/my_own_path_diary
git init
git add -A
git commit -m "chore: 現状のコードを初回コミット"
```

以降、**学習の区切りごとにコミット**します。コミットメッセージ自体が学習ログになります。

> 注意: `.env` は絶対にコミットしないこと。`.gitignore` に入っているか確認してください。
> APIキーを GitHub に上げるのは、実務で最もよく起きる事故のひとつです。

### 0-2. アプリを自分の手で起動する

`PROJECT_STATE.md` の6章の手順を、**コピペではなく1行ずつ意味を考えながら**打ちます。

```bash
npx expo start --port 8087
```

- `npx` とは何か
- `expo start` は何をしているのか（Metro bundler というサーバーが立ち上がる）
- なぜポート番号を指定するのか

この3つを説明できるようになれば Phase 0-2 は合格です。

### 0-3. `console.log` を仕込んで「動きを目で見る」

これが最強の学習ツールです。理屈より先に、動きを目撃してください。

**課題**: `src/services/dailyEntryService.ts` の `submitAnswer`（86行目）の先頭に
次を入れて、アプリで4段階ボタンを押してみる。

```ts
console.log('[submitAnswer] 呼ばれた', params);
```

ターミナルにログが出ます。ここで気づいてほしいこと:

- ボタンを1回押すと、この関数は**何回**呼ばれるか
- `params` の中身は何か（`questionId` と `value` が入っているはず）

同じ要領で、以下にもログを入れて**呼ばれる順番**を観察してください。

| ファイル | 関数 | 意味 |
|---|---|---|
| `src/components/AnswerScale.tsx` | ボタンの `onChange` | ユーザーの操作 |
| `src/hooks/useTodayEntry.ts:54` | `answerValue` | 画面ロジック |
| `src/services/dailyEntryService.ts:86` | `submitAnswer` | 業務ロジック |
| `src/db/repositories/answerRepo.ts:46` | `upsertAnswer` | DB保存 |
| `src/services/axisScore.ts:38` | `computeAxisScore` | スコア計算 |

**この順番こそが、Phase 2 で学ぶ「層」の正体です。**

### 0-4. データベースの中身を覗く

アプリが保存しているデータを、自分の目で見ます。

```bash
DB=$(find ~/Library/Developer/CoreSimulator/Devices -iname "kimishidai.db" | head -1)
sqlite3 "$DB" ".tables"
sqlite3 "$DB" "SELECT * FROM daily_entry;"
sqlite3 "$DB" "SELECT * FROM answer;"
```

画面で回答したあとにもう一度実行して、**行が増えていること**を確認してください。
「画面の操作 → データが保存される」が、頭の中でつながります。

### Phase 0 の合格ライン

- [ ] `git log` に自分のコミットが1つ以上ある
- [ ] アプリを自分で起動して、シミュレータで回答できる
- [ ] ボタンを押したときのログの出る順番を、紙に書ける
- [ ] `sqlite3` で `answer` テーブルの中身を見た

---

## Phase 1: アプリ全体の地図を持つ（1週）

「どこに何があるか」が分かるだけで、不安はかなり減ります。

### 1-1. 起動から最初の画面までを追う

起動時に通る道は、たった3ファイルです。順に読んでください。

1. **`app/_layout.tsx`** — アプリ全体の入れ物。
   - `useDbReady()` でDBの準備完了を待つ（17行目）
   - 準備できるまでは**くるくる回るインジケータだけ**を返す（27〜35行目）
   - 準備できたら `<Stack>` で画面一覧を定義（40〜51行目）

2. **`app/index.tsx`** — 振り分け係。
   - オンボーディング済みなら `/(tabs)`、まだなら `/onboarding` へ飛ばす（22行目）
   - この画面は**何も描画しない**。判断だけして次へ渡す「ゲート」

3. **`app/(tabs)/index.tsx`** — 今日の質問画面（ホーム）。

**ここで学ぶ概念**: Expo Router の「ファイルベースルーティング」
= **ファイルを置いた場所が、そのまま画面のURLになる**仕組み。

| ファイルパス | 画面 |
|---|---|
| `app/index.tsx` | `/` |
| `app/(tabs)/calendar/index.tsx` | `/(tabs)/calendar` |
| `app/day/[date].tsx` | `/day/2026-09-06`（`[date]` は変数） |

`(tabs)` のカッコは「URLに出さないグループ」という意味です。
`[date]` の角カッコは「ここは可変」という意味です。

### 1-2. 層（レイヤー）の地図を頭に入れる

このアプリは、役割ごとに5つの層に分かれています。**これが理解の背骨です。**

```
┌─────────────────────────────────────────────┐
│ ① 画面    app/                              │  何を表示するか
│    例: app/(tabs)/index.tsx                 │
├─────────────────────────────────────────────┤
│ ② 部品    src/components/                   │  見た目の部品
│    例: QuestionCard.tsx, AnswerScale.tsx    │
├─────────────────────────────────────────────┤
│ ③ フック  src/hooks/                        │  画面が使うロジック
│    例: useTodayEntry.ts                     │  （状態の保持と更新）
├─────────────────────────────────────────────┤
│ ④ サービス src/services/                    │  アプリのルール
│    例: dailyEntryService.ts, axisScore.ts   │  （業務ロジック）
├─────────────────────────────────────────────┤
│ ⑤ リポジトリ src/db/repositories/           │  SQLの実行
│    例: answerRepo.ts                        │  （保存と取得だけ）
└─────────────────────────────────────────────┘
                    ↓
              SQLite（端末内DB）
```

**ルール: 上の層は、すぐ下の層だけを呼ぶ。飛び越えない。**

なぜこうするのか（面接で必ず聞かれます）:

- 画面から直接SQLを書くと、同じSQLがあちこちにコピーされ、直すとき全部探す羽目になる
- このアプリでは「回答を保存したら軸スコアを再計算する」というルールが
  `dailyEntryService.ts` の1箇所（99行目 `recomputeEntry`）にだけ書いてある。
  だから**保存の入口がどこであっても、ルールが必ず守られる**

`src/services/dailyEntryService.ts` の21〜25行目のコメントに、この意図が明記されています。

### 1-3. 各ディレクトリの役割を1行で言えるようにする

自分の言葉で埋めてください（答えを見ずに書けたら合格）。

| ディレクトリ | 役割 |
|---|---|
| `app/` | |
| `src/components/` | |
| `src/hooks/` | |
| `src/services/` | |
| `src/db/` | |
| `src/constants/` | |
| `src/types/` | |

### Phase 1 の合格ライン

- [ ] 起動から今日の質問画面までの3ファイルを説明できる
- [ ] 5つの層をホワイトボードに書ける
- [ ] 「なぜ層を分けるのか」を30秒で説明できる

---

## Phase 2: 1機能を縦に貫通させる（1週）★最重要

**このアプリで一番大事な学習です。ここが終われば、残りは応用です。**

題材: 「質問の4段階ボタンを押してから、画面のスコアが更新されるまで」

### 2-1. 全行程を1本の線で追う

以下を、実際にファイルを開いて1ステップずつ確認してください。

```
【1】ユーザーが「ややそう思う」をタップ
      src/components/AnswerScale.tsx のボタン
            │  onChange(3)
            ▼
【2】QuestionCard が受け取って親へ渡す
      src/components/QuestionCard.tsx:61
      <AnswerScale value={...} onChange={onAnswerValue} />
            │  props で渡された関数を呼ぶだけ（部品は何も判断しない）
            ▼
【3】画面が受け取る
      app/(tabs)/index.tsx:90
      onAnswerValue={(v) => answerValue(q.id, v)}
            │  「どの質問か」を足して、フックの関数を呼ぶ
            ▼
【4】フックが応答時間を計算して、サービスへ
      src/hooks/useTodayEntry.ts:54-68
      responseTimeSeconds を計算 → submitAnswer(...)
            │
            ▼
【5】サービスが保存＆再計算を指揮する
      src/services/dailyEntryService.ts:86-101
      ├─ upsertAnswer(...)      ← 保存
      ├─ recomputeEntry(...)    ← スコアとステータスを再計算
      └─ buildDetailFromEntryId ← 画面用のデータを組み立て直す
            │
            ▼
【6】リポジトリが実際にSQLを打つ
      src/db/repositories/answerRepo.ts:46-70
      既存があれば UPDATE、なければ INSERT（= UPSERT）
            │
            ▼
【7】スコアを計算し直す
      src/services/axisScore.ts:38-66
      1〜4 を 0/33/67/100 に変換 → negative は反転 → 平均
            │
            ▼
【8】新しいデータを画面の state に入れる
      src/hooks/useTodayEntry.ts:65
      setEntry(updated)
            │
            ▼
【9】React が画面を描き直す
      app/(tabs)/index.tsx が entry の新しい中身で再実行され、
      ボタンの選択状態・進捗・スコアが更新される
```

### 2-2. この図で理解すべき5つのポイント

**① 部品（components）は何も判断しない**
`AnswerScale.tsx` は「押されたら渡された関数を呼ぶ」だけ。
保存もしないしスコアも計算しない。だから他の画面でも使い回せます。
（これを「表示に専念したコンポーネント」と呼びます）

**② 関数が上から下へ渡されていく（props）**
`answerValue` という関数が、画面 → QuestionCard → AnswerScale と手渡しされています。
これが React の基本的なデータの流れです。**データは上から下、通知は下から上。**

**③ 業務ルールはサービス層に集約されている**
「回答を保存したらスコアを再計算し、全問答えたら completed にする」
このルールは `dailyEntryService.ts:113-130` の `recomputeEntry` にしかありません。

**④ 画面が更新されるトリガーは `setEntry` だけ**
DBに保存しただけでは画面は変わりません。
`setEntry(updated)`（useTodayEntry.ts:65）が呼ばれて初めて React が描き直します。
**「保存」と「画面更新」は別物** — ここは初心者が最も混乱する箇所です。

**⑤ 保存後は、DBから読み直したデータで画面を更新している**
`submitAnswer` は保存後に `buildDetailFromEntryId` でDBから読み直しています。
手元の変数を書き換えるのではなく、**DBを唯一の正解（single source of truth）とし、
そこから読み直す**方針です。コードは少し増えますが、画面とDBがズレる事故が起きません。

### 2-3. 練習: もう1本、自分だけで追う

答えを見ずに、同じ図を自分で描いてください。

**課題A**: TODOを追加したとき（`app/(tabs)/todo/index.tsx` → `src/hooks/useTodos.ts` → `src/db/repositories/todoRepo.ts`）

**課題B**: カレンダーの日付をタップして日別詳細を開くとき
（`src/components/DayCell.tsx` → `app/(tabs)/calendar/index.tsx` → `app/day/[date].tsx`）

### Phase 2 の合格ライン

- [ ] 4段階ボタンの全9ステップを、ファイル名つきで説明できる
- [ ] 「保存」と「画面更新」が別物である理由を説明できる
- [ ] 課題A・Bの図を自力で描けた

---

## Phase 3: React の考え方（2週）

Phase 2 で出てきた「分からない言葉」を、ここで回収します。
**すべて自分のコードの実例とセットで**覚えてください。

### 3-1. コンポーネントと props（2日）

**概念**: 画面を部品に分け、部品には引数（props）を渡す。

**自分のコードの実例**: `src/components/QuestionCard.tsx:9-23`

```ts
interface Props {
  question: QuestionWithAnswer;   // 表示する質問データ
  index: number;                   // 何問目か
  total: number;                   // 全部で何問か
  editable: boolean;               // 編集できるか
  asking?: boolean;                // ?  は「省略可能」
  onAnswerValue: (value: number) => void;  // 関数も props で渡せる
}
```

**ここで学ぶこと**:
- `interface Props` = 「この部品は何を受け取るか」の契約書
- `?` は省略可能を意味する（`asking?: boolean`）
- **関数も props として渡せる**（`onAnswerValue`）← これが「下から上への通知」の正体

**課題**: `QuestionCard` に `total` を渡し忘れるとどうなるか、実際に消してみてください。
TypeScript が赤線で教えてくれます。**これが型の価値です。**

### 3-2. state と再レンダリング（3日）★ここが山場

**概念**: 「変わる値」を state に入れると、変わったとき画面が自動で描き直される。

**自分のコードの実例**: `src/hooks/useTodayEntry.ts:12-15`

```ts
const [entry, setEntry] = useState<DailyEntryDetail | null>(null);
const [loading, setLoading] = useState(true);
const [generating, setGenerating] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**理解すべきこと**:

1. `useState` は `[今の値, 更新する関数]` のペアを返す
2. `setEntry(...)` を呼ぶと、**その画面の関数がまるごと最初から実行し直される**
   （= 再レンダリング。`app/(tabs)/index.tsx` の `HomeScreen` 関数が再実行される）
3. `entry = newValue` と直接代入しても**画面は変わらない**。必ず `setEntry` を使う

**必ずやる実験**: `app/(tabs)/index.tsx` の `HomeScreen` の先頭に入れる。

```ts
console.log('HomeScreen 再レンダリング', new Date().toISOString());
```

ボタンを押すたびにログが出ます。**「押した → 関数が最初から動き直す」を目で確認**してください。
これを見ると React の挙動が一気に腑に落ちます。

### 3-3. 条件によって表示を変える（2日）

**自分のコードの実例**: `app/(tabs)/index.tsx:50-148`

このアプリのホーム画面は、`entry.status` によって**4つの見た目**を出し分けています。

| 条件 | 表示 | 行 |
|---|---|---|
| `loading` | くるくる | 31-37 |
| `status === 'not_started'` | 「今日の質問を始める」ボタン | 50-77 |
| `status === 'in_progress'` | 質問カード5枚 | 79-96 |
| `status === 'completed'` | 労い＋スコアバー | 98-127 |
| `completed` かつ 見直し中 | 質問カード5枚（再編集） | 129-148 |

**ここで学ぶ構文**:
- `{条件 && <表示>}` — 条件が true のときだけ表示（`&&` の短絡評価）
- `{条件 ? <A> : <B>}` — 三項演算子（`QuestionCard.tsx:47-59` にある）
- **早期return** — `if (loading) return <くるくる>;` で以降を書かなくて済む（31行目）

**課題**: `not_started` の画面を出したいとき、DBをどう書き換えればいいか考えて、
実際に `sqlite3` で `UPDATE daily_entry SET status='not_started' WHERE date='...'` を実行し、
アプリをリロードして確かめてください。**状態を自分で作れると、テストが一気に楽になります。**

### 3-4. リスト表示と key（1日）

**自分のコードの実例**: `app/(tabs)/index.tsx:82-94`

```ts
{entry.questions.map((q, i) => (
  <QuestionCard key={q.id} question={q} index={i} ... />
))}
```

- `.map()` = 配列の各要素を別のものに変換する（ここでは「データ → 画面部品」）
- `key` = React が「どれがどれか」を見分けるための札。**これがないと更新がおかしくなる**
- `key` に `i`（配列の順番）を使うのは避ける。ここでは `q.id` を使っていて正しい

### 3-5. useEffect（2日）

**概念**: 「レンダリングが終わったあとに、何かをする」仕組み。

**自分のコードの実例1**: `src/hooks/useDbReady.ts:8-16`

```ts
useEffect(() => {
  let mounted = true;
  ensureDbReady().then(() => {
    if (mounted) setReady(true);   // 画面が消えていたら state を触らない
  });
  return () => { mounted = false; };  // 後片付け（クリーンアップ）
}, []);   // ← 空配列 = 最初の1回だけ実行
```

**自分のコードの実例2**: `app/_layout.tsx:21-25`

```ts
useEffect(() => {
  if (dbReady) {
    syncReminderOnLaunch();
  }
}, [dbReady]);   // ← dbReady が変わったときだけ実行
```

**理解すべきこと**:
- 第2引数の配列 = 「この値が変わったら、もう一度実行する」というリスト（依存配列）
- `[]` なら初回1回だけ
- `return () => {...}` は後片付け。画面が消えるときに実行される
- `mounted` フラグは「消えた画面の state を触ってエラーになる」のを防ぐ定番パターン

### 3-6. useCallback と useRef（2日）

初心者が最も「なぜ要るのか分からない」2つです。

**useCallback** — `src/hooks/useTodayEntry.ts:18, 37, 54, 70, 88`

再レンダリングのたびに関数が作り直されるのを防ぎます。
`load` を `useCallback` で包まないと、`useEffect(() => { load(); }, [load])`（33-35行目）が
毎回「`load` が変わった」と判断して**無限ループ**になります。

> 実際に `useCallback` を外して無限ループを起こしてみてください。
> **「なぜ必要か」は、壊してみるのが一番早い。** git があるので安心して壊せます。

**useRef** — `src/hooks/useTodayEntry.ts:16`

```ts
const questionStartedAt = useRef<Map<string, number>>(new Map());
```

「値を覚えておきたいが、変わっても画面は描き直したくない」ときに使います。
ここでは「質問が表示された時刻」を記録し、回答時に差を取って応答時間を出しています（58行目）。
これを `useState` にすると、記録するたびに画面が再描画されて無駄です。

**useState と useRef の使い分け**:
- 画面に出る値 → `useState`
- 裏で覚えておくだけの値 → `useRef`

### Phase 3 の合格ライン

- [ ] `setEntry` を呼ぶと何が起きるか説明できる
- [ ] `useEffect` の依存配列の意味を説明できる
- [ ] `useCallback` を外して無限ループを再現し、元に戻せた
- [ ] `key` が必要な理由を説明できる

---

## Phase 4: データ層（1週）

### 4-1. テーブル設計を読む（2日）

`src/db/schema.ts` を上から読みます。6つのテーブルがあります。

| テーブル | 何を持つか | 行 |
|---|---|---|
| `daily_entry` | 1日1行。日付・軸スコア・状態 | 33-40 |
| `question` | その日に出した質問（5問） | 42-50 |
| `answer` | 質問への回答 | 54-62 |
| `user_preference` | 端末に1行。設定 | 64-72 |
| `screen_time_log` | 自己申告のスクリーンタイム | 74-80 |
| `todo` | TODO（v2で追加） | 90-98 |

**読むべきポイント**:

- `date TEXT NOT NULL UNIQUE` — 1日1行しか作れない制約。**DBが不整合を防いでくれる**
- `REFERENCES daily_entry(id) ON DELETE CASCADE` — 親が消えたら子も自動で消える
- `CREATE INDEX` — 検索を速くする索引。`question(daily_entry_id)` に張ってある理由を考える
- `question_id ... UNIQUE`（56行目） — 1質問につき回答は1つだけ。だから UPSERT で足りる

### 4-2. マイグレーション（2日）★実務で最重要のテーマ

`src/db/schema.ts:21-105`

**問題**: すでにユーザーが使っているアプリに、あとから `todo` テーブルを足したい。
でもユーザーの端末には古いDBがある。どうするか。

**答え**: DBに「今バージョンいくつか」を記録し、足りない分だけ順に実行する。

```ts
if (currentVersion === 0) { /* 初期テーブル作成 */ await db.execAsync('PRAGMA user_version = 1'); }
if (currentVersion === 1) { /* todoテーブル追加 */ await db.execAsync('PRAGMA user_version = 2'); }
```

**このコードの13-20行目のコメントは必読です。** 実際に起きた事故が書いてあります:

> 最後にまとめて `DATABASE_VERSION` を書くと、途中のステップが未実行でも
> バージョンだけが進んでしまい、そのステップが永久にスキップされる

これは面接で「苦労した点は？」と聞かれたときに話せる、**質の高いエピソード**です。
（実際に踏んだバグ＋原因の理解＋恒久対策、の3点が揃っている）

**課題**: v3を足す練習をしてください（例: `todo` に `note` カラムを追加）。
実際に動かす前に「既存ユーザーのDBはどうなるか」を紙に書いてから実行します。

### 4-3. リポジトリパターン（3日）

`src/db/repositories/answerRepo.ts` を全部読みます。

**このファイルの構造**（他のリポジトリも全部同じ形）:

```ts
interface AnswerRow { question_id: string; ... }     // ① DBの形（snake_case）
function toModel(row: AnswerRow): Answer { ... }      // ② アプリの形へ変換（camelCase）
export async function getAnswerByQuestionId(...)      // ③ 取得
export async function upsertAnswer(...)               // ④ 保存
```

**ここで学ぶこと**:

1. **DBの世界とアプリの世界を分ける**
   DBは `question_id`、アプリは `questionId`。この変換を `toModel` が一手に引き受けています。
   おかげで、アプリ側のコードにSQLの都合が漏れません。

2. **プレースホルダ `?` を使う**（28-31行目）
   ```ts
   db.getFirstAsync('SELECT * FROM answer WHERE question_id = ?', questionId)
   ```
   文字列連結でSQLを組み立てると **SQLインジェクション**という脆弱性になります。
   `?` を使えば安全。**面接で聞かれる定番なので必ず説明できるように。**

3. **IN句の動的プレースホルダ**（37-41行目）
   ```ts
   const placeholders = questionIds.map(() => '?').join(',');
   ```
   配列の要素数だけ `?,?,?` を作る技法。読み解けると自信になります。

4. **UPSERT**（46-70行目）
   「あれば UPDATE、なければ INSERT」。当日中は回答を編集できる仕様（要件6.2）を支えています。

### Phase 4 の合格ライン

- [ ] 6テーブルの関係を図に描ける
- [ ] マイグレーションで v3 を追加できた
- [ ] `?` プレースホルダを使う理由を説明できる
- [ ] `toModel` が何のためにあるか説明できる

---

## Phase 5: 非同期処理（1週）

初心者が最も詰まる場所です。ここを越えると、エラーの意味が読めるようになります。

### 5-1. async / await（3日）

**自分のコードの実例**: `src/services/dailyEntryService.ts:43-47`

```ts
export async function loadTodayEntryDetail(now: Date = new Date()): Promise<DailyEntryDetail> {
  const dateKey = toDateKey(now);
  const entry = await getOrCreateDailyEntry(dateKey);   // ← DBの処理を「待つ」
  return buildDetailFromEntryId(entry.id);
}
```

**理解すべきこと**:

- DBの読み書きは**時間がかかる**（一瞬だが、ゼロではない）
- `await` は「終わるまで待つ」という意味
- `await` を書ける関数には `async` が必要
- `async` 関数の戻り値は必ず `Promise<T>` になる

**必ずやる実験**: `await` を1つ消してみてください。

```ts
const entry = getOrCreateDailyEntry(dateKey);   // await を消す
console.log(entry);   // → Promise { <pending> } と出る
```

**「Promise が pending って出る」= await を忘れている**、というパターンを体に覚えさせます。
これは実務で最も頻繁に遭遇するミスの1つです。

### 5-2. ローディング状態の作り方（2日）

**自分のコードの実例**: `src/hooks/useTodayEntry.ts:18-31`

```ts
const load = useCallback(async () => {
  setLoading(true);          // ① 始まる前に true
  try {
    const detail = await loadTodayEntryDetail();
    setEntry(detail);
  } finally {
    setLoading(false);       // ② 成功でも失敗でも必ず false
  }
}, []);
```

**`finally` が重要**: エラーが起きても `setLoading(false)` が実行されます。
これがないと、失敗したとき**くるくる回り続けて画面が固まります**。

### 5-3. エラーハンドリング（2日）

**自分のコードの実例**: `src/hooks/useTodayEntry.ts:37-52`

```ts
try {
  const detail = await startTodayQuestions();
  setEntry(detail);
} catch (e) {
  setError('質問の生成に失敗しました。もう一度お試しください。');  // ← ユーザー向けの言葉
  console.warn(e);                                                  // ← 開発者向けの詳細
} finally {
  setGenerating(false);
}
```

**設計として優れている点**（面接で言える）:
- ユーザーには**分かる日本語**を、開発者にはログに**技術的な詳細**を出している
- エラーでも `finally` でボタンが押せる状態に戻る
- 表示は `app/(tabs)/index.tsx:64` の `{error && <Text>}` で行われる

### 5-4. 「なぜ dbReady が必要なのか」を理解する

`app/_layout.tsx:17, 27-35`

DBのマイグレーションが終わる前に画面がSQLを打つと、テーブルがなくてクラッシュします。
だから「準備できるまで画面を出さない」というガードを入れています。

**これは非同期処理の典型的な設計パターン**（初期化の完了を待つゲート）です。
`src/db/client.ts:11-19` の `readyPromise` が「初期化を1回だけにする」仕掛けです。

```ts
let readyPromise: Promise<void> | null = null;
export function ensureDbReady(): Promise<void> {
  if (!readyPromise) {           // 2回目以降は同じ Promise を返す
    readyPromise = migrateDbIfNeeded(db);
  }
  return readyPromise;
}
```

**なぜこうするか**: 何度呼ばれてもマイグレーションは1回しか走りません。
これを「メモ化」または「シングルトン」と呼びます。

### Phase 5 の合格ライン

- [ ] `await` を忘れたときの症状（`Promise { <pending> }`）を知っている
- [ ] `try/catch/finally` の各ブロックの役割を説明できる
- [ ] `ensureDbReady` が2回呼ばれても安全な理由を説明できる

---

## Phase 6: デバッグ技術（1週）★「バグに対応できるか不安」への回答

**バグ対応は才能ではなく、手順です。** 手順を覚えれば誰でもできます。

### 6-1. バグ調査の型（守るべき順番）

```
1. 再現する      ── 「必ず起きる条件」を特定する。再現しないバグは直せない
2. 層を切り分ける ── Phase 2 の5層のうち、どこで壊れているか
3. ログで確認    ── 仮説を console.log で検証する
4. 原因を特定    ── 「なぜそうなるか」を言葉にできるまで掘る
5. 直す          ── 症状ではなく原因を直す
6. 確認する      ── 再現手順をもう一度やって、直ったことを確かめる
```

**最も重要なのは 2 の「層の切り分け」です。**

例: 「回答したのにスコアが変わらない」

| 質問 | 確認方法 | Yesなら | Noなら |
|---|---|---|---|
| DBには保存されている？ | `sqlite3` で `answer` を見る | 表示側の問題 | 保存側の問題 |
| `computeAxisScore` は呼ばれてる？ | `console.log` | 計算ロジックの問題 | 呼び出し経路の問題 |
| `setEntry` は呼ばれてる？ | `console.log` | React側の問題 | サービス層の問題 |

**「上から順に半分に切っていく」** — これが二分探索デバッグです。
やみくもにコードを眺めるのではなく、**問題の範囲を半分ずつ狭めます。**

### 6-2. わざとバグを仕込んで直す練習 ★このPhaseの本体

git があるので、壊しても `git checkout .` で戻せます。
**以下を1つずつ実際にやってください。** 症状を見て、原因を推測してから答え合わせします。

| # | 仕込むバグ | 予想される症状 | 学べること |
|---|---|---|---|
| 1 | `useTodayEntry.ts:65` の `setEntry(updated)` を消す | | 保存と画面更新は別 |
| 2 | `axisScore.ts:22` の `100 - normalized` を `normalized` に | | polarity反転の意味 |
| 3 | `dailyEntryService.ts:99` の `recomputeEntry` を消す | | 業務ルールの集約点 |
| 4 | `app/(tabs)/index.tsx:84` の `key={q.id}` を消す | | key の役割 |
| 5 | `schema.ts:82` の `PRAGMA user_version = 1` を消す | | マイグレーションの罠 |
| 6 | `useTodayEntry.ts:18` の `useCallback` を外す | | 依存配列と無限ループ |
| 7 | `dailyEntryService.ts:45` の `await` を消す | | Promise の理解 |
| 8 | `useTodayEntry.ts:29` の `finally` を `catch` に変える | | ローディング固まり |

**各バグについて記録するもの**:
- 症状（画面で何が起きたか）
- どうやって原因にたどり着いたか（**この過程が実力**）
- 直し方

この記録は、そのまま**ポートフォリオの技術ブログ記事**になります。

### 6-3. エラーメッセージの読み方（2日）

React Native のエラー画面（赤い画面）の読み方:

1. **1行目**: エラーの種類とメッセージ ← まずここだけ読む
2. **スタックトレース**: 呼び出しの履歴。**上から自分のコードが出てくる最初の行**を探す
   - `node_modules` の中の行は基本的に無視してよい
   - `src/` や `app/` で始まる行が犯人の近く

**よく出るエラーと原因**:

| エラー | 典型的な原因 |
|---|---|
| `undefined is not an object (evaluating 'x.y')` | `x` が `null`/`undefined`。オプショナルチェイン `x?.y` で守る |
| `Objects are not valid as a React child` | オブジェクトをそのまま画面に出そうとした |
| `Too many re-renders` | レンダリング中に `setState` を呼んでいる |
| `no such table: xxx` | マイグレーション未実行（Phase 4-2 の罠） |
| `Cannot read property of null` | DBに行がないのに使おうとした |

### 6-4. 型チェックを味方にする

```bash
npx tsc --noEmit
```

**これは実行せずにバグを見つけるツールです。** 修正のたびに走らせる癖をつけてください。
「実行しないと分からないバグ」を「書いた瞬間に分かるバグ」に変えるのが TypeScript の価値です。

### Phase 6 の合格ライン

- [ ] 8つの仕込みバグすべてを、症状から原因にたどり着けた
- [ ] スタックトレースから自分のコードの行を特定できる
- [ ] 「二分探索デバッグ」を説明できる

---

## Phase 7: 自分で機能を1つ足す（1週）

**読めるだけでは「作れる」とは言えません。** 小さくていいので、ゼロから足します。

### 推奨課題: 「連続記録日数（ストリーク）の表示」

理由: 5層すべてを通り、既存コードの真似ができ、ポートフォリオでも見栄えがする。

**実装手順（層を下から順に作る）**:

1. **リポジトリ層**: `dailyEntryRepo.ts` に「直近の連続記録日数を数える」関数を足す
   - ヒント: `SELECT date FROM daily_entry WHERE status = 'completed' ORDER BY date DESC`
2. **サービス層**: `services/streakService.ts` を新規作成し、連続日数の計算ロジックを書く
   - 「今日から遡って、日付が1日ずつ連続している間カウント」
3. **フック層**: `hooks/useStreak.ts` を作る（`useUserPreference.ts` が良い手本、24行と短い）
4. **部品層**: `components/StreakBadge.tsx` を作る
5. **画面層**: `app/(tabs)/index.tsx` に置く

**進め方のコツ**: 各層を作るたびに `console.log` で動作確認し、**動いたらコミット**します。
一気に全部書いてから動かすと、どこが悪いか分からなくなります。

### 他の候補（余力があれば）

- 月間の記録日数をカレンダー画面に表示
- 質問カテゴリ別の平均スコア一覧（`localAnalysis/feedbackAggregator.ts` が参考になる）
- TODOの「誰のため」内訳を円グラフで表示

### Phase 7 の合格ライン

- [ ] 5層すべてに自分で書いたコードがある
- [ ] 途中経過が5個以上のコミットに分かれている
- [ ] `npx tsc --noEmit` が通る

---

## Phase 8: ポートフォリオ化（1週）

### 8-1. AI で作ったことをどう説明するか ★正面から扱う

これは避けて通れません。**隠すのが最悪手です。**

2026年現在、実務のエンジニアは全員AIを使っています。採用側が見ているのは
「AIを使ったか」ではなく **「AIの出力を評価・判断できるか」** です。

**このプロジェクトには、その証拠がすでにあります。** `PROJECT_STATE.md` の3章です。

| 判断 | 内容 | なぜ評価されるか |
|---|---|---|
| 3-1 | TODO達成率を軸スコアに入れない | 4つの具体例で反例を検証している。**仕様を疑う力** |
| 3-2 | スクリーンタイムも同様に不採用 | 同じ思想を一貫して適用している |
| 3-3 | 回答UIに色ヒントを出さない | UIがデータの質を歪める、という洞察 |
| 3-4 | polarity のバランスを取る | 実測で問題を発見し、1万回シミュレーションで検証 |
| 3-5 | 共有画像に平均スコアを載せない | ユーザー心理を考えた判断 |

**これらは全部、AIが勝手に出すものではありません。**
「なぜそうしないのか」を考えた人間がいた証拠です。面接ではこう言えます。

> 「実装のコード生成にはAIを使いました。ただ、仕様の判断は自分でしています。
>  例えばTODOの達成率を軸スコアに入れる案がありましたが、
>  『上司に言われた仕事を全部こなした日が満点になる』という反例に気づいて不採用にしました。
>  このアプリが検出したい状態と真逆の結果になるからです。」

これは**AIに書かせただけの人には絶対に言えない**発言です。

### 8-2. README を書き直す

現在の `README.md` は「AIが質問を生成する」と書いてありますが、
`PROJECT_STATE.md` によれば**第0段階ではAI未使用**です。ここは実態と食い違っています。
まずこの矛盾を直してください（**ドキュメントの整合性も評価対象です**）。

README に入れるべきもの:

1. スクリーンショット（`store/out/` に既にある）
2. 一言でアプリの説明
3. 技術構成（なぜそれを選んだか付き）
4. アーキテクチャ図（Phase 1-2 の5層の図）
5. 工夫した点（8-1 の設計判断から3つ）
6. 苦労した点と解決（Phase 6 のバグ記録から）
7. 今後の課題（テスト未整備、IAP未実装など）← **正直に書くほうが信頼される**

### 8-3. 面接で聞かれる質問と、答えの材料

| 質問 | 材料のありか |
|---|---|
| なぜ React Native？ | iOS/Android両対応を1コードで。個人開発で工数が最大の制約 |
| なぜ SQLite？ アカウント登録なし？ | `PROJECT_STATE.md` 集客の節「内面をどこにも送らない」が差別化 |
| なぜ層を分けた？ | `dailyEntryService.ts:21-25` のコメント。ルールの集約 |
| 一番苦労したのは？ | マイグレーションの `user_version` 事故（`schema.ts:13-20`） |
| 想定外だったことは？ | expo-notifications の DAILY トリガーがドキュメントと違った件 |
| 改善したい点は？ | テストコードがない。CI がない。IAP 未実装 |
| ユーザーは何人？ | 正直に。**代わりに「なぜまだ広めないか」の判断**を語る（ペイウォール未実装だから） |

**「改善したい点」を自分から言えることが、実は最も評価されます。**
自分のコードの弱点を認識できている＝レビューを受け入れられる人、と判断されるからです。

### 8-4. 弱点を1つだけ潰すなら「テスト」

現在このプロジェクトにはテストコードが1行もありません。
ポートフォリオとしては、ここが最も分かりやすい伸びしろです。

**最初に書くべきテスト**: `src/services/axisScore.ts`
理由: 外部依存（DB・画面）が一切ない純粋な関数なので、テストが最も書きやすい。

```
- 全部「4」を選んだら 100 になる
- polarity=negative の質問で「4」を選んだら 0 になる
- 未回答の質問は平均に含まれない
- 1問も回答がなければ null が返る
```

`jest-expo` を入れて4本書くだけで、README に「テストあり」と書けます。
**費用対効果が最も高い作業です。**

### Phase 8 の合格ライン

- [ ] README が実態と一致している
- [ ] GitHub に公開されている（`.env` が含まれていないことを確認）
- [ ] 面接想定質問7つに、それぞれ1分で答えられる
- [ ] `axisScore` のテストが4本ある

---

## 進め方のルール

1. **1日30分でもいいので毎日触る。** 週末にまとめてやるより効果が高い
2. **分からない言葉が出たら、まず自分のコードで実例を探す。** 抽象的な説明より実物が早い
3. **「動いた」で止めない。「なぜ動いたか」を1行で書く**
4. **区切りごとにコミットする。** メッセージが学習ログになる
5. **壊すことを恐れない。** git がある。壊して直すのが最速の学習法
6. **私（Claude）への質問の仕方**: 「これ何？」ではなく
   「`useTodayEntry.ts:65` の `setEntry` が何をしているか、初心者向けに説明して」
   のように**ファイル名と行番号を添える**と、精度が段違いに上がります

---

## 次のステップ

Phase 0 の `git init` から始めてください。
準備ができたら「Phase 1 のコード解説をお願いします」と言ってもらえれば、
このロードマップに沿って、実際のコードを1行ずつ解説していきます。
