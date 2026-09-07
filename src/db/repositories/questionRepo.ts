import { db } from '../client';
import { generateId } from '@/lib/id';
import type { Question, QuestionPolarity, QuestionSource } from '@/types/models';

interface QuestionRow {
  id: string;
  daily_entry_id: string;
  text: string;
  category: string;
  polarity: QuestionPolarity;
  source: QuestionSource;
  display_order: number;
}

function toModel(row: QuestionRow): Question {
  return {
    id: row.id,
    dailyEntryId: row.daily_entry_id,
    text: row.text,
    category: row.category,
    polarity: row.polarity,
    source: row.source,
    displayOrder: row.display_order,
  };
}

export interface NewQuestionInput {
  text: string;
  category: string;
  polarity: QuestionPolarity;
  source: QuestionSource;
}

/** 6.1: AI生成 or フォールバックの質問セットをまとめて保存する */
export async function insertQuestions(
  dailyEntryId: string,
  questions: NewQuestionInput[]
): Promise<Question[]> {
  const result: Question[] = [];
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = generateId('q');
      await db.runAsync(
        `INSERT INTO question (id, daily_entry_id, text, category, polarity, source, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        dailyEntryId,
        q.text,
        q.category,
        q.polarity,
        q.source,
        i
      );
      result.push({
        id,
        dailyEntryId,
        text: q.text,
        category: q.category,
        polarity: q.polarity,
        source: q.source,
        displayOrder: i,
      });
    }
  });
  return result;
}

export async function listQuestionsByDailyEntryId(dailyEntryId: string): Promise<Question[]> {
  const rows = await db.getAllAsync<QuestionRow>(
    'SELECT * FROM question WHERE daily_entry_id = ? ORDER BY display_order ASC',
    dailyEntryId
  );
  return rows.map(toModel);
}

/**
 * 直近N日間に出題した質問文を、**新しい順**（最後に出した日が新しいものから）で取得する。
 * プールが112問あっても単純ランダムでは体感で重複するため、直近に出したものは候補から外す。
 *
 * 【並び順が意味を持つ ★変更前に読むこと】
 * 呼び出し側（getFallbackQuestionSet）は、除外が多すぎてプールが枯れるとき
 * 「古い側の除外から順に諦める」。そのため、この配列は必ず新しい順である必要がある。
 * 以前は ORDER BY が無く DISTINCT の順序に依存していたため、どれが古いか判別できなかった。
 * MAX(date) で「その質問を最後に出した日」を取り、それで降順に並べている。
 */
export async function listRecentQuestionTexts(days: number): Promise<string[]> {
  const rows = await db.getAllAsync<{ text: string }>(
    `SELECT question.text AS text, MAX(daily_entry.date) AS last_used
     FROM question
     JOIN daily_entry ON daily_entry.id = question.daily_entry_id
     WHERE daily_entry.date >= date('now', 'localtime', ?)
     GROUP BY question.text
     ORDER BY last_used DESC`,
    `-${days} days`
  );
  return rows.map((row) => row.text);
}

export async function countQuestionsByDailyEntryId(dailyEntryId: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM question WHERE daily_entry_id = ?',
    dailyEntryId
  );
  return row?.count ?? 0;
}
