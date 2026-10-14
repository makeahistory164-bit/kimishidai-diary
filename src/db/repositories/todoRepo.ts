import { db } from '../client';
import { generateId, nowIso } from '@/lib/id';
import type { Todo, TodoDoneFor } from '@/types/models';

interface TodoRow {
  id: string;
  date: string;
  text: string;
  done_for: TodoDoneFor | null;
  completed_at: string | null;
  display_order: number;
  created_at: string;
}

function toModel(row: TodoRow): Todo {
  return {
    id: row.id,
    date: row.date,
    text: row.text,
    doneFor: row.done_for,
    completedAt: row.completed_at,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

export async function listTodosByDate(date: string): Promise<Todo[]> {
  const rows = await db.getAllAsync<TodoRow>(
    'SELECT * FROM todo WHERE date = ? ORDER BY display_order ASC, created_at ASC',
    date
  );
  return rows.map(toModel);
}

export async function createTodo(date: string, text: string): Promise<Todo> {
  const row = await db.getFirstAsync<{ maxOrder: number | null }>(
    'SELECT MAX(display_order) as maxOrder FROM todo WHERE date = ?',
    date
  );
  const displayOrder = (row?.maxOrder ?? -1) + 1;
  const id = generateId('todo');
  const createdAt = nowIso();

  await db.runAsync(
    `INSERT INTO todo (id, date, text, done_for, completed_at, display_order, created_at)
     VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
    id,
    date,
    text,
    displayOrder,
    createdAt
  );

  return { id, date, text, doneFor: null, completedAt: null, displayOrder, createdAt };
}

/**
 * TODOを完了にする。完了時に「誰のためにやったか」を必ず受け取る設計にしている
 * （タスクを作った時点では分からないことが多く、やり終えた直後に振り返るほうが
 * 実態に近いため）。
 */
export async function completeTodo(id: string, doneFor: TodoDoneFor): Promise<void> {
  await db.runAsync(
    'UPDATE todo SET done_for = ?, completed_at = ? WHERE id = ?',
    doneFor,
    nowIso(),
    id
  );
}

/** 完了を取り消す（誤タップの取り消し用）。done_forもクリアする */
export async function uncompleteTodo(id: string): Promise<void> {
  await db.runAsync('UPDATE todo SET done_for = NULL, completed_at = NULL WHERE id = ?', id);
}

/** 完了済みTODOの「誰のため」だけを付け替える */
export async function updateTodoDoneFor(id: string, doneFor: TodoDoneFor): Promise<void> {
  await db.runAsync('UPDATE todo SET done_for = ? WHERE id = ?', doneFor, id);
}

export async function updateTodoText(id: string, text: string): Promise<void> {
  await db.runAsync('UPDATE todo SET text = ? WHERE id = ?', text, id);
}

export async function deleteTodo(id: string): Promise<void> {
  await db.runAsync('DELETE FROM todo WHERE id = ?', id);
}

/** 10.3のサマリー生成用: 直近N日分のTODOを取得（当日を含む） */
export async function listRecentTodos(
  beforeDateInclusive: string,
  days: number
): Promise<Todo[]> {
  const rows = await db.getAllAsync<TodoRow>(
    `SELECT * FROM todo
     WHERE date <= ? AND date >= date(?, ?)
     ORDER BY date ASC, display_order ASC`,
    beforeDateInclusive,
    beforeDateInclusive,
    `-${days - 1} days`
  );
  return rows.map(toModel);
}

/** 月次レポート用: 期間内（両端含む）のTODOを取得 */
export async function listTodosInRange(startDate: string, endDate: string): Promise<Todo[]> {
  const rows = await db.getAllAsync<TodoRow>(
    `SELECT * FROM todo WHERE date >= ? AND date <= ? ORDER BY date ASC, display_order ASC`,
    startDate,
    endDate
  );
  return rows.map(toModel);
}
