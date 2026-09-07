import { listRecentAnswersWithCategory } from '@/db/repositories/answerRepo';

/**
 * 10.5: 質問の良し悪しの評価・改善の仕組み（MVP=ローカル完結）。
 * 👍👎フィードバックをカテゴリ別に集計し、「好まれる/避けるべきカテゴリ」を判定する。
 * 専用の集計テーブルは持たず、都度クエリで算出する方針（9.4）。
 */
export type CategoryPreference = 'favored' | 'avoided' | 'neutral';

export interface CategoryFeedbackSummary {
  category: string;
  upCount: number;
  downCount: number;
  preference: CategoryPreference;
}

export async function summarizeCategoryFeedback(
  sampleSize = 100
): Promise<CategoryFeedbackSummary[]> {
  const recent = await listRecentAnswersWithCategory(sampleSize);
  const byCategory = new Map<string, { up: number; down: number }>();

  for (const answer of recent) {
    if (!answer.feedback) continue;
    const entry = byCategory.get(answer.category) ?? { up: 0, down: 0 };
    if (answer.feedback === 'up') entry.up += 1;
    if (answer.feedback === 'down') entry.down += 1;
    byCategory.set(answer.category, entry);
  }

  const result: CategoryFeedbackSummary[] = [];
  for (const [category, { up, down }] of byCategory.entries()) {
    let preference: CategoryPreference = 'neutral';
    if (down >= 2 && down > up) preference = 'avoided';
    else if (up >= 2 && up > down * 2) preference = 'favored';
    result.push({ category, upCount: up, downCount: down, preference });
  }
  return result;
}

export function favoredCategories(summary: CategoryFeedbackSummary[]): string[] {
  return summary.filter((s) => s.preference === 'favored').map((s) => s.category);
}

export function avoidedCategories(summary: CategoryFeedbackSummary[]): string[] {
  return summary.filter((s) => s.preference === 'avoided').map((s) => s.category);
}
