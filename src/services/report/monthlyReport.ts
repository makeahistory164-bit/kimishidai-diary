import { listDailyEntriesInRange } from '@/db/repositories/dailyEntryRepo';
import { listScoredAnswersInRange } from '@/db/repositories/answerRepo';
import { listTodosInRange } from '@/db/repositories/todoRepo';
import { applyPolarity, normalizeAnswerValue } from '@/services/axisScore';
import {
  TODO_DONE_FOR_OPTIONS,
  type DailyEntry,
  type QuestionPolarity,
  type Todo,
  type TodoDoneFor,
} from '@/types/models';

/**
 * 月次レポート（要件書12.3「月次・年次レポート」の月次部分。プレミアム機能）。
 *
 * 端末内の記録だけで計算する。AIは使わない ── 買い切りの特典に含めるため、
 * 利用者が増えても費用が増えない作りであることが前提（services/purchases 参照）。
 *
 * 【見せ方の方針 ★変更前に読むこと】
 * - 月の平均スコアは数字で出さない。共有画像に平均を載せない（PROJECT_STATE.md 3-5）のと
 *   同じ理由で、低い月を突きつけると振り返り自体をやめてしまう層が対象のため。
 * - テーマ別は「保てていた順」に並べ、良かった点が先に目に入るようにする。
 * - 「誰のため」は採点しない（3-1）。内訳を事実として並べるだけ。
 *
 * 年次レポートは未実装。1年分の記録が溜まったユーザーが出てから作る。
 */

/** テーマ別に表示する最低回答数。1回だけの回答で「傾向」と呼ぶのは言い過ぎになるため */
export const MIN_ANSWERS_PER_CATEGORY = 2;
/** 先月比や前半・後半比で「変化あり」とみなす差（0〜100のスコア上の点数） */
export const CHANGE_THRESHOLD = 10;
/** 前半・後半の比較に必要な、各半分の最低記録日数 */
const MIN_DAYS_PER_HALF = 2;
/** 月の前半を1〜15日とする */
const FIRST_HALF_LAST_DAY = 15;

export interface ScoredAnswerRow {
  date: string;
  category: string;
  polarity: QuestionPolarity;
  value: number;
}

export interface DailyScorePoint {
  day: number;
  /** その日の軸スコア（0〜100）。記録のない日は null */
  axisScore: number | null;
}

export type HalfComparison = 'later_higher' | 'earlier_higher' | 'steady';

export interface CategoryReport {
  category: string;
  /** 0〜100（polarity反転込み。軸スコアと同じ尺度） */
  score: number;
  answerCount: number;
  /** 先月との比較。先月の回答が足りないときは null */
  change: 'up' | 'down' | 'same' | null;
}

export interface DoneForReport {
  value: TodoDoneFor;
  label: string;
  emoji: string;
  count: number;
  /** 0〜1 */
  ratio: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  recordedDays: number;
  dailyScores: DailyScorePoint[];
  /** 前半・後半の記録が足りないときは null */
  halfComparison: HalfComparison | null;
  /** 保てていた順（score の降順） */
  categories: CategoryReport[];
  /** 回答が MIN_ANSWERS_PER_CATEGORY 未満で表示しなかったテーマ */
  sparseCategories: string[];
  doneFor: { total: number; items: DoneForReport[] };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthRange(year: number, month: number): [string, string] {
  return [`${year}-${pad(month)}-01`, `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`];
}

function previousMonth(year: number, month: number): [number, number] {
  return month === 1 ? [year - 1, 12] : [year, month - 1];
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** カテゴリごとの平均スコア（0〜100）と回答数 */
function scoreByCategory(answers: ScoredAnswerRow[]): Map<string, { score: number; count: number }> {
  const grouped = new Map<string, number[]>();
  for (const a of answers) {
    const list = grouped.get(a.category) ?? [];
    list.push(applyPolarity(normalizeAnswerValue(a.value), a.polarity));
    grouped.set(a.category, list);
  }
  const result = new Map<string, { score: number; count: number }>();
  for (const [category, scores] of grouped) {
    result.set(category, { score: Math.round(average(scores)), count: scores.length });
  }
  return result;
}

function compareHalves(points: DailyScorePoint[]): HalfComparison | null {
  const recorded = points.filter((p): p is { day: number; axisScore: number } => p.axisScore !== null);
  const earlier = recorded.filter((p) => p.day <= FIRST_HALF_LAST_DAY).map((p) => p.axisScore);
  const later = recorded.filter((p) => p.day > FIRST_HALF_LAST_DAY).map((p) => p.axisScore);
  if (earlier.length < MIN_DAYS_PER_HALF || later.length < MIN_DAYS_PER_HALF) return null;
  const diff = average(later) - average(earlier);
  if (diff >= CHANGE_THRESHOLD) return 'later_higher';
  if (diff <= -CHANGE_THRESHOLD) return 'earlier_higher';
  return 'steady';
}

/** DBを読まない計算部分。入力はすべて対象月（先月分の回答のみ previousAnswers）。 */
export function computeMonthlyReport(input: {
  year: number;
  month: number;
  entries: DailyEntry[];
  answers: ScoredAnswerRow[];
  previousAnswers: ScoredAnswerRow[];
  todos: Todo[];
}): MonthlyReport {
  const { year, month, entries, answers, previousAnswers, todos } = input;

  const scoreByDay = new Map<number, number>();
  for (const e of entries) {
    if (e.axisScore === null) continue;
    scoreByDay.set(Number(e.date.slice(8, 10)), e.axisScore);
  }
  const dailyScores: DailyScorePoint[] = Array.from(
    { length: daysInMonth(year, month) },
    (_, i) => ({ day: i + 1, axisScore: scoreByDay.get(i + 1) ?? null })
  );

  const current = scoreByCategory(answers);
  const previous = scoreByCategory(previousAnswers);
  const categories: CategoryReport[] = [];
  const sparseCategories: string[] = [];
  for (const [category, { score, count }] of current) {
    if (count < MIN_ANSWERS_PER_CATEGORY) {
      sparseCategories.push(category);
      continue;
    }
    const prev = previous.get(category);
    let change: CategoryReport['change'] = null;
    if (prev && prev.count >= MIN_ANSWERS_PER_CATEGORY) {
      const diff = score - prev.score;
      change = diff >= CHANGE_THRESHOLD ? 'up' : diff <= -CHANGE_THRESHOLD ? 'down' : 'same';
    }
    categories.push({ category, score, answerCount: count, change });
  }
  categories.sort((a, b) => b.score - a.score);

  const completed = todos.filter((t) => t.completedAt !== null && t.doneFor !== null);
  const total = completed.length;
  const items = TODO_DONE_FOR_OPTIONS.map((option) => {
    const count = completed.filter((t) => t.doneFor === option.value).length;
    return { ...option, count, ratio: total > 0 ? count / total : 0 };
  });

  return {
    year,
    month,
    recordedDays: scoreByDay.size,
    dailyScores,
    halfComparison: compareHalves(dailyScores),
    categories,
    sparseCategories,
    doneFor: { total, items },
  };
}

export async function buildMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const [start, end] = monthRange(year, month);
  const [prevYear, prevMonth] = previousMonth(year, month);
  const [prevStart, prevEnd] = monthRange(prevYear, prevMonth);

  const [entries, answers, previousAnswers, todos] = await Promise.all([
    listDailyEntriesInRange(start, end),
    listScoredAnswersInRange(start, end),
    listScoredAnswersInRange(prevStart, prevEnd),
    listTodosInRange(start, end),
  ]);

  return computeMonthlyReport({ year, month, entries, answers, previousAnswers, todos });
}
