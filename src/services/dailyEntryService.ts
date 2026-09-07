import { toDateKey } from '@/lib/id';
import {
  getDailyEntryByDate,
  getDailyEntryById,
  getOrCreateDailyEntry,
  updateDailyEntryAxisScore,
  updateDailyEntryStatus,
} from '@/db/repositories/dailyEntryRepo';
import { insertQuestions, listQuestionsByDailyEntryId } from '@/db/repositories/questionRepo';
import {
  getAnswerByQuestionId,
  listAnswersByQuestionIds,
  setAnswerFeedback,
  upsertAnswer,
} from '@/db/repositories/answerRepo';
import { computeAxisScore } from '@/services/axisScore';
import { buildDailySummary } from '@/services/localAnalysis/summaryBuilder';
import { generateQuestions } from '@/services/ai/questionGenerator';
import type { AnswerFeedback, DailyEntryDetail, QuestionWithAnswer } from '@/types/models';

/**
 * 8.1/8.3の画面が必要とする「1日分のデータ」をまとめて組み立て・更新するサービス層。
 * DBリポジトリを直接叩くのではなく、常にここを経由することで
 * 「Answer更新のたびにaxis_score/statusを再計算する」（9.4）というルールを一箇所に集約する。
 */

async function buildDetailFromEntryId(entryId: string): Promise<DailyEntryDetail> {
  const questions = await listQuestionsByDailyEntryId(entryId);
  const answers = await listAnswersByQuestionIds(questions.map((q) => q.id));
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));
  const questionsWithAnswers: QuestionWithAnswer[] = questions.map((q) => ({
    ...q,
    answer: answerByQuestionId.get(q.id) ?? null,
  }));

  const entry = await getDailyEntryById(entryId);
  if (!entry) throw new Error(`DailyEntry not found: ${entryId}`);

  return { ...entry, questions: questionsWithAnswers };
}

/** 8.1: 画面表示用に「今日」のエントリを取得（なければ作成、質問は未生成のことがある） */
export async function loadTodayEntryDetail(now: Date = new Date()): Promise<DailyEntryDetail> {
  const dateKey = toDateKey(now);
  const entry = await getOrCreateDailyEntry(dateKey);
  return buildDetailFromEntryId(entry.id);
}

/** 8.3: 過去日の閲覧用。DailyEntryが存在しない日はnull（=未実施、11.4） */
export async function loadEntryDetailByDate(dateKey: string): Promise<DailyEntryDetail | null> {
  const entry = await getDailyEntryByDate(dateKey);
  if (!entry) return null;
  return buildDetailFromEntryId(entry.id);
}

/**
 * 8.1「今日の質問を始める」: サマリーを組み立ててAI質問生成→フォールバックの上、
 * その日のQuestionとして保存する。既に質問がある場合は生成し直さず既存を返す（冪等）。
 */
export async function startTodayQuestions(now: Date = new Date()): Promise<DailyEntryDetail> {
  const dateKey = toDateKey(now);
  const entry = await getOrCreateDailyEntry(dateKey);
  const existingQuestions = await listQuestionsByDailyEntryId(entry.id);
  if (existingQuestions.length > 0) {
    if (entry.status === 'not_started') {
      await updateDailyEntryStatus(entry.id, 'in_progress');
    }
    return buildDetailFromEntryId(entry.id);
  }

  const summary = await buildDailySummary(now);
  const { questions, source } = await generateQuestions(summary);
  await insertQuestions(
    entry.id,
    questions.map((q) => ({ text: q.text, category: q.category, polarity: q.polarity, source }))
  );
  // 質問が生成された時点で not_started → in_progress へ遷移させる（8.1の状態分岐）。
  // 実際の完了判定（in_progress→completed）は回答のたびにrecomputeEntryで行う。
  if (questions.length > 0) {
    await updateDailyEntryStatus(entry.id, 'in_progress');
  }
  return buildDetailFromEntryId(entry.id);
}

/** 8.1/6.2: 回答保存＋軸スコア・ステータス再計算（9.4） */
export async function submitAnswer(params: {
  dailyEntryId: string;
  questionId: string;
  value: number;
  memo?: string | null;
  responseTimeSeconds?: number | null;
}): Promise<DailyEntryDetail> {
  await upsertAnswer({
    questionId: params.questionId,
    value: params.value,
    memo: params.memo,
    responseTimeSeconds: params.responseTimeSeconds,
  });
  await recomputeEntry(params.dailyEntryId);
  return buildDetailFromEntryId(params.dailyEntryId);
}

/** 10.5: 質問ごとの👍/👎フィードバック保存 */
export async function submitFeedback(
  dailyEntryId: string,
  questionId: string,
  feedback: AnswerFeedback
): Promise<DailyEntryDetail> {
  await setAnswerFeedback(questionId, feedback);
  return buildDetailFromEntryId(dailyEntryId);
}

async function recomputeEntry(dailyEntryId: string): Promise<void> {
  const questions = await listQuestionsByDailyEntryId(dailyEntryId);
  const answers = await listAnswersByQuestionIds(questions.map((q) => q.id));
  const { axisScore } = computeAxisScore(questions, answers);

  const answeredCount = answers.length;
  const status =
    answeredCount === 0
      ? 'not_started'
      : answeredCount < questions.length
        ? 'in_progress'
        : 'completed';

  await Promise.all([
    updateDailyEntryAxisScore(dailyEntryId, axisScore),
    updateDailyEntryStatus(dailyEntryId, status),
  ]);
}

export async function getAnswerForQuestion(questionId: string) {
  return getAnswerByQuestionId(questionId);
}
