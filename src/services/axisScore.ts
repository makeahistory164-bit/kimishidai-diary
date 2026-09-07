import type { Answer, Question } from '@/types/models';

/**
 * 要件定義書 11章「軸スコア算出ロジック」の実装。
 *
 * 11.3 算出手順:
 *  1. 各質問の回答（4段階）を0〜100に正規化
 *  2. polarity=negativeの質問はスコアを反転（100-値）
 *  3. その日に回答した質問のみを対象に単純平均
 *  4. 未回答の質問は計算に含めない
 *
 * 11.5で「今後の検討事項」とされていた正規化式は、本実装では
 * 1→4を0/33/67/100の等間隔マッピングとして採用する（MVPの確定方針）。
 */
export function normalizeAnswerValue(value: number): number {
  // value: 1〜4 → 0, 33.33..., 66.66..., 100
  const clamped = Math.min(4, Math.max(1, value));
  return ((clamped - 1) / 3) * 100;
}

export function applyPolarity(normalized: number, polarity: Question['polarity']): number {
  return polarity === 'negative' ? 100 - normalized : normalized;
}

export interface ScoredQuestion {
  questionId: string;
  category: string;
  polarity: Question['polarity'];
  /** 0〜100（polarity適用後、内訳表示用） */
  score: number;
}

/**
 * 質問一覧と回答一覧から、当日の軸スコア（0〜100の整数）と
 * 各質問ごとのスコア内訳（8.3の色ドット表示用）を算出する。
 * 1問も回答がなければnullを返す（11.4: 未回答日は集計対象外）。
 */
export function computeAxisScore(
  questions: Question[],
  answers: Answer[]
): { axisScore: number | null; breakdown: ScoredQuestion[] } {
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));
  const breakdown: ScoredQuestion[] = [];

  for (const question of questions) {
    const answer = answerByQuestionId.get(question.id);
    if (!answer) continue; // 未回答の設問はスコア計算に含めない（11.3-4）

    const normalized = normalizeAnswerValue(answer.value);
    const score = applyPolarity(normalized, question.polarity);
    breakdown.push({
      questionId: question.id,
      category: question.category,
      polarity: question.polarity,
      score,
    });
  }

  if (breakdown.length === 0) {
    return { axisScore: null, breakdown: [] };
  }

  const sum = breakdown.reduce((acc, b) => acc + b.score, 0);
  const axisScore = Math.round(sum / breakdown.length);
  return { axisScore, breakdown };
}
