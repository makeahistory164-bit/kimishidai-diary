import { db } from '../client';
import { generateId, nowIso } from '@/lib/id';
import type { Answer, AnswerFeedback, QuestionPolarity } from '@/types/models';

interface AnswerRow {
  id: string;
  question_id: string;
  value: number;
  memo: string | null;
  feedback: AnswerFeedback;
  response_time_seconds: number | null;
  answered_at: string;
}

function toModel(row: AnswerRow): Answer {
  return {
    id: row.id,
    questionId: row.question_id,
    value: row.value,
    memo: row.memo,
    feedback: row.feedback,
    responseTimeSeconds: row.response_time_seconds,
    answeredAt: row.answered_at,
  };
}

export async function getAnswerByQuestionId(questionId: string): Promise<Answer | null> {
  const row = await db.getFirstAsync<AnswerRow>(
    'SELECT * FROM answer WHERE question_id = ?',
    questionId
  );
  return row ? toModel(row) : null;
}

export async function listAnswersByQuestionIds(questionIds: string[]): Promise<Answer[]> {
  if (questionIds.length === 0) return [];
  const placeholders = questionIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<AnswerRow>(
    `SELECT * FROM answer WHERE question_id IN (${placeholders})`,
    ...questionIds
  );
  return rows.map(toModel);
}

/** 8.1: 回答保存。当日中は再編集可のため既存があればUPSERT（6.2） */
export async function upsertAnswer(input: {
  questionId: string;
  value: number;
  memo?: string | null;
  responseTimeSeconds?: number | null;
}): Promise<Answer> {
  const existing = await getAnswerByQuestionId(input.questionId);
  const answeredAt = nowIso();

  if (existing) {
    await db.runAsync(
      `UPDATE answer SET value = ?, memo = ?, response_time_seconds = ?, answered_at = ?
       WHERE question_id = ?`,
      input.value,
      input.memo ?? null,
      input.responseTimeSeconds ?? null,
      answeredAt,
      input.questionId
    );
    return {
      ...existing,
      value: input.value,
      memo: input.memo ?? null,
      responseTimeSeconds: input.responseTimeSeconds ?? null,
      answeredAt,
    };
  }

  const id = generateId('a');
  await db.runAsync(
    `INSERT INTO answer (id, question_id, value, memo, feedback, response_time_seconds, answered_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?)`,
    id,
    input.questionId,
    input.value,
    input.memo ?? null,
    input.responseTimeSeconds ?? null,
    answeredAt
  );
  return {
    id,
    questionId: input.questionId,
    value: input.value,
    memo: input.memo ?? null,
    feedback: null,
    responseTimeSeconds: input.responseTimeSeconds ?? null,
    answeredAt,
  };
}

/** 10.5: 質問ごとの👍/👎フィードバック */
export async function setAnswerFeedback(
  questionId: string,
  feedback: AnswerFeedback
): Promise<void> {
  await db.runAsync('UPDATE answer SET feedback = ? WHERE question_id = ?', feedback, questionId);
}

/** 10.5サマリー用: カテゴリ別フィードバック集計のため、直近N件の回答+カテゴリを取得 */
export async function listRecentAnswersWithCategory(
  limit: number
): Promise<Array<Answer & { category: string }>> {
  const rows = await db.getAllAsync<AnswerRow & { category: string }>(
    `SELECT answer.*, question.category as category
     FROM answer
     JOIN question ON question.id = answer.question_id
     ORDER BY answer.answered_at DESC
     LIMIT ?`,
    limit
  );
  return rows.map((row) => ({ ...toModel(row), category: row.category }));
}

/** 月次レポート用: 期間内（両端含む）の回答を、日付・カテゴリ・polarity付きで取得 */
export async function listScoredAnswersInRange(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; category: string; polarity: QuestionPolarity; value: number }>> {
  return db.getAllAsync(
    `SELECT daily_entry.date AS date, question.category AS category,
            question.polarity AS polarity, answer.value AS value
     FROM answer
     JOIN question ON question.id = answer.question_id
     JOIN daily_entry ON daily_entry.id = question.daily_entry_id
     WHERE daily_entry.date >= ? AND daily_entry.date <= ?
     ORDER BY daily_entry.date ASC`,
    startDate,
    endDate
  );
}
