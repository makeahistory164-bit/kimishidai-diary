import { listRecentDailyEntries } from '@/db/repositories/dailyEntryRepo';
import { listQuestionsByDailyEntryId } from '@/db/repositories/questionRepo';
import { listAnswersByQuestionIds } from '@/db/repositories/answerRepo';
import { getUserPreference } from '@/db/repositories/userPreferenceRepo';
import { toDateKey } from '@/lib/id';
import { extractKeywords } from './keywordExtractor';
import {
  avoidedCategories,
  favoredCategories,
  summarizeCategoryFeedback,
} from './feedbackAggregator';
import { computeScreenTimeVsAverage, getScreenTimeProvider } from '@/services/screenTime';
import { listRecentTodos } from '@/db/repositories/todoRepo';

/**
 * 要件定義書 10.3「サマリー例（AIへの入力イメージ）」に対応する型・生成ロジック。
 *
 * 【スケールについての注記】
 * ここでの avg_score / categories[].avg_score は、10.3の例（"avg_score": 3.2 等）に
 * 合わせて回答の生値（1〜4）そのままの平均とする。11章の軸スコア（0〜100、
 * polarity反転込み）はカレンダー表示等ユーザー向けの指標であり、別の目的を持つ
 * 数値として意図的に区別している（AIへの傾向共有には単純な生値平均で十分なため）。
 */
export interface CategorySummary {
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * TODOの集計。「誰のためにやったか」の内訳を持つ。
 * 軸スコアには使わず、AI質問生成の材料としてのみ渡す（models.ts の TodoDoneFor 参照）。
 */
export interface TodoSummary {
  totalCount: number;
  completedCount: number;
  /** 完了したTODOの「誰のため」内訳 */
  doneForBreakdown: Record<string, number>;
  /** 未完了のまま残ったTODO数 */
  unfinishedCount: number;
}

export interface DailySummaryInput {
  period: string;
  avgScore: number;
  answeredDays: number;
  categories: Record<string, CategorySummary>;
  recentKeywords: string[];
  screenTimeVsAvg: string | null;
  lastAnsweredDaysAgo: number | null;
  dayOfWeek: string;
  timeOfDay: string;
  interestThemes: string[];
  preferredCategories: string[];
  avoidedCategories: string[];
  todos: TodoSummary;
}

const DAY_OF_WEEK_JA = ['日', '月', '火', '水', '木', '金', '土'];

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 11) return '朝';
  if (hour >= 11 && hour < 17) return '昼';
  if (hour >= 17 && hour < 23) return '夜';
  return '深夜';
}

function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export async function buildDailySummary(now: Date = new Date()): Promise<DailySummaryInput> {
  const todayKey = toDateKey(now);
  const yesterdayKey = toDateKey(addDays(now, -1));

  const recentEntries = await listRecentDailyEntries(yesterdayKey, 7);
  const answeredEntries = recentEntries.filter((e) => e.axisScore !== null);

  type ScoredAnswer = { date: string; category: string; value: number; memo: string | null };
  const scoredAnswers: ScoredAnswer[] = [];

  for (const entry of recentEntries) {
    const questions = await listQuestionsByDailyEntryId(entry.id);
    if (questions.length === 0) continue;
    const answers = await listAnswersByQuestionIds(questions.map((q) => q.id));
    const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));
    for (const q of questions) {
      const a = answerByQuestionId.get(q.id);
      if (!a) continue;
      scoredAnswers.push({ date: entry.date, category: q.category, value: a.value, memo: a.memo });
    }
  }

  // avg_score（全体、生値1-4スケール）
  const avgScore =
    scoredAnswers.length > 0
      ? Number(
          (scoredAnswers.reduce((sum, a) => sum + a.value, 0) / scoredAnswers.length).toFixed(1)
        )
      : 0;

  // カテゴリ別集計＋トレンド（前半/後半で比較）
  const categories: Record<string, CategorySummary> = {};
  const byCategory = new Map<string, ScoredAnswer[]>();
  for (const a of scoredAnswers) {
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }
  for (const [category, list] of byCategory.entries()) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const avg = sorted.reduce((sum, a) => sum + a.value, 0) / sorted.length;
    let trend: CategorySummary['trend'] = 'stable';
    const uniqueDates = new Set(sorted.map((a) => a.date));
    if (uniqueDates.size >= 2) {
      const mid = Math.floor(sorted.length / 2);
      const earlier = sorted.slice(0, mid);
      const later = sorted.slice(mid);
      const earlierAvg = earlier.reduce((s, a) => s + a.value, 0) / earlier.length;
      const laterAvg = later.reduce((s, a) => s + a.value, 0) / later.length;
      const diff = laterAvg - earlierAvg;
      if (diff >= 0.4) trend = 'up';
      else if (diff <= -0.4) trend = 'down';
    }
    categories[category] = { avgScore: Number(avg.toFixed(1)), trend };
  }

  // 直近キーワード（10.2: 生テキストはこの関数の外に出さない。抽出結果のみ）
  const memos = scoredAnswers.map((a) => a.memo).filter((m): m is string => !!m && m.trim().length > 0);
  const recentKeywords = extractKeywords(memos, 4);

  // スクリーンタイム直近平均比（10.6）
  const todayMinutes = await getScreenTimeProvider().getTodayMinutes();
  const screenTimeVsAvg = await computeScreenTimeVsAverage(todayKey, todayMinutes);

  // 最終回答からの経過日数
  const lastAnswered = [...answeredEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
  let lastAnsweredDaysAgo: number | null = null;
  if (lastAnswered) {
    const diffMs = now.getTime() - new Date(`${lastAnswered.date}T00:00:00`).getTime();
    lastAnsweredDaysAgo = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  // 曜日・時間帯
  const dayOfWeek = DAY_OF_WEEK_JA[now.getDay()];
  const timeOfDay = getTimeOfDay(now.getHours());

  // 関心テーマ（任意）
  const preference = await getUserPreference();

  // 10.5: 好み/避けるべきカテゴリ
  const feedbackSummary = await summarizeCategoryFeedback();

  // TODO集計（直近7日）
  const recentTodos = await listRecentTodos(todayKey, 7);
  const completedTodos = recentTodos.filter((t) => t.completedAt !== null);
  const doneForBreakdown: Record<string, number> = {};
  for (const todo of completedTodos) {
    if (!todo.doneFor) continue;
    doneForBreakdown[todo.doneFor] = (doneForBreakdown[todo.doneFor] ?? 0) + 1;
  }

  return {
    period: '直近7日間',
    avgScore,
    answeredDays: answeredEntries.length,
    categories,
    recentKeywords,
    screenTimeVsAvg,
    lastAnsweredDaysAgo,
    dayOfWeek,
    timeOfDay,
    interestThemes: preference.interestThemes,
    preferredCategories: favoredCategories(feedbackSummary),
    avoidedCategories: avoidedCategories(feedbackSummary),
    todos: {
      totalCount: recentTodos.length,
      completedCount: completedTodos.length,
      doneForBreakdown,
      unfinishedCount: recentTodos.length - completedTodos.length,
    },
  };
}
