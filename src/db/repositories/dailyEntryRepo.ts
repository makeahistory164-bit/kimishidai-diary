import { db } from '../client';
import { generateId, nowIso } from '@/lib/id';
import type { DailyEntry, DailyEntryStatus } from '@/types/models';

interface DailyEntryRow {
  id: string;
  date: string;
  axis_score: number | null;
  status: DailyEntryStatus;
  created_at: string;
  updated_at: string;
}

function toModel(row: DailyEntryRow): DailyEntry {
  return {
    id: row.id,
    date: row.date,
    axisScore: row.axis_score,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDailyEntryByDate(date: string): Promise<DailyEntry | null> {
  const row = await db.getFirstAsync<DailyEntryRow>(
    'SELECT * FROM daily_entry WHERE date = ?',
    date
  );
  return row ? toModel(row) : null;
}

export async function getDailyEntryById(id: string): Promise<DailyEntry | null> {
  const row = await db.getFirstAsync<DailyEntryRow>('SELECT * FROM daily_entry WHERE id = ?', id);
  return row ? toModel(row) : null;
}

/** 9.4: DailyEntryはその日にアプリを開いた時点で作成する */
export async function getOrCreateDailyEntry(date: string): Promise<DailyEntry> {
  const existing = await getDailyEntryByDate(date);
  if (existing) return existing;

  const id = generateId('entry');
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO daily_entry (id, date, axis_score, status, created_at, updated_at)
     VALUES (?, ?, NULL, 'not_started', ?, ?)`,
    id,
    date,
    now,
    now
  );
  return { id, date, axisScore: null, status: 'not_started', createdAt: now, updatedAt: now };
}

export async function updateDailyEntryStatus(
  id: string,
  status: DailyEntryStatus
): Promise<void> {
  await db.runAsync(
    'UPDATE daily_entry SET status = ?, updated_at = ? WHERE id = ?',
    status,
    nowIso(),
    id
  );
}

/** 9.4: Answer確定のたびにaxis_scoreを再計算しキャッシュする */
export async function updateDailyEntryAxisScore(
  id: string,
  axisScore: number | null
): Promise<void> {
  await db.runAsync(
    'UPDATE daily_entry SET axis_score = ?, updated_at = ? WHERE id = ?',
    axisScore,
    nowIso(),
    id
  );
}

/** 8.2 カレンダー月間ビュー用: 期間内（両端含む）のエントリを取得 */
export async function listDailyEntriesInRange(
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const rows = await db.getAllAsync<DailyEntryRow>(
    'SELECT * FROM daily_entry WHERE date >= ? AND date <= ? ORDER BY date ASC',
    startDate,
    endDate
  );
  return rows.map(toModel);
}

/** 10.3 サマリー生成用: 直近N日分（当日を含む）のエントリを取得 */
export async function listRecentDailyEntries(
  beforeDateInclusive: string,
  days: number
): Promise<DailyEntry[]> {
  const rows = await db.getAllAsync<DailyEntryRow>(
    `SELECT * FROM daily_entry WHERE date <= ? ORDER BY date DESC LIMIT ?`,
    beforeDateInclusive,
    days
  );
  return rows.map(toModel).reverse();
}
