import type { QuestionPolarity } from '@/types/models';

/**
 * 6.1: 質問プール。
 *
 * 【現在の役割】AI質問生成を導入するまでの間、これがアプリの質問供給源そのもの。
 * AI導入後はフォールバック（生成失敗時の受け皿）になる。
 *
 * 要件書2章が挙げる「毎日同じ質問だと形骸化しやすい」という課題に対し、
 * 十分な問数を確保する必要がある。1日5問出すため、10問では2日で一巡してしまう。
 * 現在112問（positive/negative各56問、10カテゴリ）あるので、重複回避と併せて
 * 3週間以上は同じ質問に当たらない設計になっている。
 *
 * polarity: positive = 「そう思う」寄りが自分軸が高い / negative = 「そう思う」寄りが低い
 */
export interface FallbackQuestionTemplate {
  text: string;
  category: string;
  polarity: QuestionPolarity;
}

export const FALLBACK_QUESTION_POOL: FallbackQuestionTemplate[] = [
  // ── 仕事 ───────────────────────────────────────────────
  { text: '今日、自分の意思で選んだ行動はあった？', category: '仕事', polarity: 'positive' },
  { text: '「本当はやりたくないのに」と思いながら引き受けたことはあった？', category: '仕事', polarity: 'negative' },
  { text: '今日の仕事の中で、自分なりの工夫を加えられた場面はあった？', category: '仕事', polarity: 'positive' },
  { text: '納得できないまま進めてしまった作業はあった？', category: '仕事', polarity: 'negative' },
  { text: '今日、断ってもよかったのに引き受けてしまったことはあった？', category: '仕事', polarity: 'negative' },
  { text: '自分の判断で進め方を変えた場面はあった？', category: '仕事', polarity: 'positive' },
  { text: '評価されるかどうかを気にして動いた場面はあった？', category: '仕事', polarity: 'negative' },
  { text: '今日やった仕事の中で、自分でも意味を感じられたものはあった？', category: '仕事', polarity: 'positive' },
  { text: '本当は違うと思ったのに、その場の空気で同意したことはあった？', category: '仕事', polarity: 'negative' },
  { text: '自分から手を挙げて動いたことはあった？', category: '仕事', polarity: 'positive' },
  { text: '「忙しいから」を理由に、考えるのを止めてしまったことはあった？', category: '仕事', polarity: 'negative' },
  { text: '今日、自分のペースで仕事を進められた時間はあった？', category: '仕事', polarity: 'positive' },
  { text: '誰かに任せてよかったことを、自分で抱え込まなかった？', category: '仕事', polarity: 'positive' },
  { text: '終わらせることだけが目的になっていた作業はあった？', category: '仕事', polarity: 'negative' },
  { text: '今日の働き方は、自分が続けたいと思える形だった？', category: '仕事', polarity: 'positive' },

  // ── 人間関係 ────────────────────────────────────────────
  { text: '今日、誰かの顔色をうかがって決めたことはあった？', category: '人間関係', polarity: 'negative' },
  { text: '今日、自分の意見をきちんと言葉にできた場面はあった？', category: '人間関係', polarity: 'positive' },
  { text: '嫌われたくなくて、本音を飲み込んだことはあった？', category: '人間関係', polarity: 'negative' },
  { text: '相手と意見が違ったとき、自分の考えを伝えられた？', category: '人間関係', polarity: 'positive' },
  { text: '無理に話を合わせてしまった場面はあった？', category: '人間関係', polarity: 'negative' },
  { text: '今日、誰かに素直に「ありがとう」を伝えられた？', category: '人間関係', polarity: 'positive' },
  { text: '本当は疲れているのに、元気なふりをしていた？', category: '人間関係', polarity: 'negative' },
  { text: '自分から誰かに連絡を取った？', category: '人間関係', polarity: 'positive' },
  { text: '会いたくない人と、断れずに会った？', category: '人間関係', polarity: 'negative' },
  { text: '今日、一緒にいて安心できる人と過ごせた時間はあった？', category: '人間関係', polarity: 'positive' },
  { text: '誰かの機嫌を直すために、自分を後回しにした？', category: '人間関係', polarity: 'negative' },
  { text: '言いたかったことを、今日ちゃんと言えた？', category: '人間関係', polarity: 'positive' },
  { text: 'SNSで他人と自分を比べてしまった？', category: '人間関係', polarity: 'negative' },
  { text: '今日、誰かに助けを求めることができた？', category: '人間関係', polarity: 'positive' },
  { text: '「いい人」でいようとして疲れた場面はあった？', category: '人間関係', polarity: 'negative' },

  // ── お金 ───────────────────────────────────────────────
  { text: '今日使ったお金は、自分が本当に納得した使い方だった？', category: 'お金', polarity: 'positive' },
  { text: 'なんとなく、流されて使ってしまったお金はあった？', category: 'お金', polarity: 'negative' },
  { text: '欲しいと思ったものを、自分の判断で選べた？', category: 'お金', polarity: 'positive' },
  { text: '周りに合わせるために出したお金はあった？', category: 'お金', polarity: 'negative' },
  { text: '今日の出費は、自分の価値観に沿っていた？', category: 'お金', polarity: 'positive' },
  { text: 'ストレスを埋めるために何かを買った？', category: 'お金', polarity: 'negative' },
  { text: '自分のために気持ちよくお金を使えた場面はあった？', category: 'お金', polarity: 'positive' },
  { text: '「安いから」だけの理由で決めたことはあった？', category: 'お金', polarity: 'negative' },
  { text: 'お金の使い方について、自分で考える時間を取れた？', category: 'お金', polarity: 'positive' },
  { text: '見栄のために使ったお金はあった？', category: 'お金', polarity: 'negative' },

  // ── 健康 ───────────────────────────────────────────────
  { text: '誰かに合わせて、自分の予定や体調を後回しにしたことはあった？', category: '健康', polarity: 'negative' },
  { text: '今日は自分のペースで過ごせた時間があった？', category: '健康', polarity: 'positive' },
  { text: '疲れているのに、休まずに動き続けた？', category: '健康', polarity: 'negative' },
  { text: '今日、自分の体の声を聞いて行動を変えた場面はあった？', category: '健康', polarity: 'positive' },
  { text: '眠りたいのに、なんとなく夜更かしをした？', category: '健康', polarity: 'negative' },
  { text: '食べたいものを、自分で選んで食べられた？', category: '健康', polarity: 'positive' },
  { text: '予定を詰め込みすぎて、余白がなかった？', category: '健康', polarity: 'negative' },
  { text: '今日、意識して深呼吸したり立ち止まったりした瞬間はあった？', category: '健康', polarity: 'positive' },
  { text: '断れば休めたのに、無理をして動いた？', category: '健康', polarity: 'negative' },
  { text: '自分の心身のために、今日何かひとつでもできた？', category: '健康', polarity: 'positive' },
  { text: '「みんなやっているから」と自分の限界を無視した？', category: '健康', polarity: 'negative' },
  { text: '今日は自分にとってちょうどいい忙しさだった？', category: '健康', polarity: 'positive' },

  // ── 家族 ───────────────────────────────────────────────
  { text: '家族との関わり方について、無理をしてしまった場面はあった？', category: '家族', polarity: 'negative' },
  { text: '家族に対して、自分の気持ちを正直に伝えられた？', category: '家族', polarity: 'positive' },
  { text: '家族の期待に合わせて、自分の希望を諦めた？', category: '家族', polarity: 'negative' },
  { text: '今日、家族と過ごした時間に自分も納得していた？', category: '家族', polarity: 'positive' },
  { text: '言われたことに反射的に従ってしまった場面はあった？', category: '家族', polarity: 'negative' },
  { text: '家族のためにしたことを、自分でもやりたいと思えていた？', category: '家族', polarity: 'positive' },
  { text: '本音を隠して、波風を立てないようにした？', category: '家族', polarity: 'negative' },
  { text: '今日、自分のための時間を家族に伝えて確保できた？', category: '家族', polarity: 'positive' },
  { text: '「家族だから仕方ない」で片づけたことはあった？', category: '家族', polarity: 'negative' },
  { text: '家族との関係の中で、自分らしくいられた瞬間はあった？', category: '家族', polarity: 'positive' },

  // ── 恋愛 ───────────────────────────────────────────────
  { text: '相手に合わせすぎて、自分の予定を変えた？', category: '恋愛', polarity: 'negative' },
  { text: '今日、相手に自分の気持ちを伝えられた？', category: '恋愛', polarity: 'positive' },
  { text: '嫌われたくなくて、思っていることを言えなかった？', category: '恋愛', polarity: 'negative' },
  { text: '相手といるとき、自然体の自分でいられた？', category: '恋愛', polarity: 'positive' },
  { text: '返信や連絡のことばかり気にしていた？', category: '恋愛', polarity: 'negative' },
  { text: '自分の時間と相手との時間、どちらも大事にできた？', category: '恋愛', polarity: 'positive' },
  { text: '本当はしたくないことを、相手のために引き受けた？', category: '恋愛', polarity: 'negative' },
  { text: '相手の意見と違っても、自分の考えを持ち続けられた？', category: '恋愛', polarity: 'positive' },

  // ── 将来・キャリア ──────────────────────────────────────
  { text: '「周りがそうしているから」という理由だけで選んだことはあった？', category: '将来・キャリア', polarity: 'negative' },
  { text: '今日一日を振り返って、自分らしい選択ができたと思える瞬間はあった？', category: '将来・キャリア', polarity: 'positive' },
  { text: '将来のことを、他人の基準で考えてしまった？', category: '将来・キャリア', polarity: 'negative' },
  { text: '今日やったことは、自分が行きたい方向につながっていた？', category: '将来・キャリア', polarity: 'positive' },
  { text: '「こうあるべき」に自分を合わせようとした？', category: '将来・キャリア', polarity: 'negative' },
  { text: '自分がやりたいことに、少しでも時間を使えた？', category: '将来・キャリア', polarity: 'positive' },
  { text: '他人の成功と比べて焦った？', category: '将来・キャリア', polarity: 'negative' },
  { text: '今日、自分の価値観について考える時間はあった？', category: '将来・キャリア', polarity: 'positive' },
  { text: '選べたはずなのに、選ばずに流された場面はあった？', category: '将来・キャリア', polarity: 'negative' },
  { text: '小さくても、自分で決めたと言える選択があった？', category: '将来・キャリア', polarity: 'positive' },

  // ── 時間の使い方 ────────────────────────────────────────
  { text: '今日の時間の使い方に、自分で納得できている？', category: '時間の使い方', polarity: 'positive' },
  { text: '気づいたら時間が溶けていた、という時間帯はあった？', category: '時間の使い方', polarity: 'negative' },
  { text: '自分のためだけに使えた時間はあった？', category: '時間の使い方', polarity: 'positive' },
  { text: '人の予定に振り回された一日だった？', category: '時間の使い方', polarity: 'negative' },
  { text: '今日、意識して何かをやめる判断をした？', category: '時間の使い方', polarity: 'positive' },
  { text: 'なんとなくスマホを触っていた時間が長かった？', category: '時間の使い方', polarity: 'negative' },
  { text: '朝、自分の意思で一日の始め方を選べた？', category: '時間の使い方', polarity: 'positive' },
  { text: '「やらなきゃ」に追われて終わった一日だった？', category: '時間の使い方', polarity: 'negative' },
  { text: '今日、余白のある時間を持てた？', category: '時間の使い方', polarity: 'positive' },
  { text: '本当はやりたいことがあったのに、後回しにした？', category: '時間の使い方', polarity: 'negative' },

  // ── 自分との約束（TODO関連）──────────────────────────────
  { text: '今日やると決めたことを、自分のために進められた？', category: '自分との約束', polarity: 'positive' },
  { text: 'やると決めたことより、頼まれごとを優先した？', category: '自分との約束', polarity: 'negative' },
  { text: '今日のタスクの多くは、自分で選んだものだった？', category: '自分との約束', polarity: 'positive' },
  { text: 'やらなくてもよかったことに、時間を使った？', category: '自分との約束', polarity: 'negative' },
  { text: '「これは今日やらない」と自分で決めたことはあった？', category: '自分との約束', polarity: 'positive' },
  { text: '誰かに言われたからという理由だけでやったことはあった？', category: '自分との約束', polarity: 'negative' },
  { text: 'やり終えたことに、自分でも意味を感じられた？', category: '自分との約束', polarity: 'positive' },
  { text: '終わらなかったことを、必要以上に責めてしまった？', category: '自分との約束', polarity: 'negative' },
  { text: '今日、自分との約束をひとつでも守れた？', category: '自分との約束', polarity: 'positive' },
  { text: 'やることを詰め込みすぎて、どれも中途半端になった？', category: '自分との約束', polarity: 'negative' },
  { text: '途中で「これは要らない」と判断してやめたことはあった？', category: '自分との約束', polarity: 'positive' },
  { text: '断れずに増えたタスクはあった？', category: '自分との約束', polarity: 'negative' },

  // ── 感情・気づき ────────────────────────────────────────
  { text: '今日感じたモヤモヤの理由を、自分で言葉にできた？', category: '感情・気づき', polarity: 'positive' },
  { text: '感じた違和感を、なかったことにした？', category: '感情・気づき', polarity: 'negative' },
  { text: '今日、素直に嬉しいと感じられた瞬間はあった？', category: '感情・気づき', polarity: 'positive' },
  { text: 'イライラの原因から目をそらした？', category: '感情・気づき', polarity: 'negative' },
  { text: '自分の感情を、誰かに話すことができた？', category: '感情・気づき', polarity: 'positive' },
  { text: '「こんなことで悩むなんて」と自分を否定した？', category: '感情・気づき', polarity: 'negative' },
  { text: '今日の自分に、ねぎらいの言葉をかけられる？', category: '感情・気づき', polarity: 'positive' },
  { text: '本当の気持ちに蓋をした場面はあった？', category: '感情・気づき', polarity: 'negative' },
  { text: '今日、自分の変化に気づけたことはあった？', category: '感情・気づき', polarity: 'positive' },
  { text: '誰かの評価で、自分の気分が決まってしまった？', category: '感情・気づき', polarity: 'negative' },
];

/**
 * 除外をどれだけ適用しても、最低これだけは候補（fresh）を残す。
 *
 * 【なぜ必要か ★変更前に読むこと】
 * 「直近21日の重複回避」は 21日 × 5問 = 最大105問を除外する。プールは112問しかないため、
 * 3週間使い込むと候補が7問まで枯れ、polarityの交互取得もカテゴリ分散も成立しなくなる。
 * 実測では positive が 0〜5問 まで振れ（＝「〜してしまった？」が5問並ぶ日が出る）、
 * カテゴリ重複も15%の日で発生していた。これは要件書8.4「責めない語り口」から外れる、
 * まさに交互取得が防ごうとしていた事象そのもの。
 *
 * 対策として、除外は「新しいものから順に」適用し、この数を下回る分は古い側から諦める。
 * 実効的な重複回避はおよそ16〜17日分になるが、シミュレーションでは
 * 「直近7日以内の質問が再登場する日」は0%のままで、体感の重複は悪化しない。
 *
 * 値の根拠: 現行112問のプールで、下限28問を境にカテゴリ重複が消える（実測）。余裕を見て32。
 * 将来プールを増やして 105 + 32 = 137問以上になれば、この上限は発動しなくなり、
 * 21日の重複回避がそのまま効くようになる（＝プール拡張と併用できる）。
 */
const MIN_FRESH_QUESTIONS = 32;

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 6.1: 3〜5問の質問セットを取得する。
 *
 * @param count 取得する問数
 * @param excludeTexts 直近に出題済みで除外したい質問文（重複回避）
 * @param interestThemes ユーザーが設定した関心テーマ（UserPreference.interest_themes）
 *
 * 3つのバランスを取る:
 * - **polarity**: positive/negativeをほぼ半々にする。単純ランダムだと
 *   「〜してしまった？」だけが5問並ぶ日が発生し（実測で発生した）、
 *   責めない・寄り添う語り口（要件書8.4）から外れてしまうため。
 * - **カテゴリ**: 同じカテゴリに偏らないようにする。
 * - **関心テーマ**: 設定されていれば、そのカテゴリを優先的に選ぶ。
 *
 * 【関心テーマは「絞り込み」ではなく「優先」である ★変更前に読むこと】
 * 関心テーマ以外を除外する実装にしてはいけない。「仕事」だけを選んだユーザーに
 * 仕事の質問を5問出すと、要件書2章が課題として挙げている「毎日同じ質問だと
 * 形骸化しやすい」に逆戻りするため。
 * カテゴリ重複を禁じる既存の仕組みと組み合わさることで、1つの関心テーマから
 * 選ばれるのは最大1問になり、残りの枠は自然に他カテゴリで埋まる。
 * 結果として「関心テーマは必ず入るが、独占はしない」という強さに収まる。
 */
export function getFallbackQuestionSet(
  count = 5,
  excludeTexts: readonly string[] = [],
  interestThemes: readonly string[] = []
): FallbackQuestionTemplate[] {
  // excludeTextsは新しい順（listRecentQuestionTexts が保証）。
  // 全部除外すると候補が枯れて交互取得が壊れるため、古い側の除外から諦める。
  const maxExclusions = Math.max(0, FALLBACK_QUESTION_POOL.length - MIN_FRESH_QUESTIONS);
  const excluded = new Set(excludeTexts.slice(0, maxExclusions));
  const interested = new Set(interestThemes);
  const isFresh = (q: FallbackQuestionTemplate) => !excluded.has(q.text);

  const freshPositive = shuffle(FALLBACK_QUESTION_POOL.filter((q) => isFresh(q) && q.polarity === 'positive'));
  const freshNegative = shuffle(FALLBACK_QUESTION_POOL.filter((q) => isFresh(q) && q.polarity === 'negative'));
  const stale = shuffle(FALLBACK_QUESTION_POOL.filter((q) => !isFresh(q)));

  const picked: FallbackQuestionTemplate[] = [];
  const usedCategories = new Set<string>();

  /**
   * 指定リストから1問取り出す。優先順位は
   *   1. 関心テーマ かつ 未使用カテゴリ
   *   2. 未使用カテゴリ（関心テーマ外も可）← 関心テーマを使い切ったらここに落ちる
   *   3. カテゴリ重複を許して先頭
   */
  const takeOne = (pool: FallbackQuestionTemplate[]): FallbackQuestionTemplate | null => {
    if (pool.length === 0) return null;
    let index = pool.findIndex(
      (q) => interested.has(q.category) && !usedCategories.has(q.category)
    );
    if (index === -1) index = pool.findIndex((q) => !usedCategories.has(q.category));
    if (index === -1) index = 0;
    const [q] = pool.splice(index, 1);
    usedCategories.add(q.category);
    return q;
  };

  // positive/negativeを交互に取り、偏りを防ぐ。
  // 開始側をランダムにして、奇数問のときにどちらかへ固定的に偏らないようにする。
  let takePositive = Math.random() < 0.5;
  while (picked.length < count) {
    const primary = takePositive ? freshPositive : freshNegative;
    const secondary = takePositive ? freshNegative : freshPositive;

    const q = takeOne(primary) ?? takeOne(secondary) ?? takeOne(stale);
    if (!q) break; // プール自体が空
    picked.push(q);
    takePositive = !takePositive;
  }

  return picked;
}
