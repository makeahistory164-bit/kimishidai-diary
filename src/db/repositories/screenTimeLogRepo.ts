import { db } from '../client';
import { generateId, nowIso } from '@/lib/id';
import type { ScreenTimeLog, ScreenTimeSource } from '@/types/models';

interface ScreenTimeLogRow {
  id: string;
  date: string;
  total_minutes: number;
  source: ScreenTimeSource;
  collected_at: string;
}

function toModel(row: ScreenTimeLogRow): ScreenTimeLog {
  return {
    id: row.id,
    date: row.date,
    totalMinutes: row.total_minutes,
    source: row.source,
    collectedAt: row.collected_at,
  };
}

/** 10.6: その日の自己申告スクリーンタイムを保存（1日1件、UPSERT） */
export async function upsertScreenTimeLog(
  date: string,
  totalMinutes: number,
  source: ScreenTimeSource
): Promise<ScreenTimeLog> {
  const existing = await db.getFirstAsync<ScreenTimeLogRow>(
    'SELECT * FROM screen_time_log WHERE date = ?',
    date
  );
  const collectedAt = nowIso();

  if (existing) {
    await db.runAsync(
      'UPDATE screen_time_log SET total_minutes = ?, source = ?, collected_at = ? WHERE date = ?',
      totalMinutes,
      source,
      collectedAt,
      date
    );
    return { ...toModel(existing), totalMinutes, source, collectedAt };
  }

  const id = generateId('st');
  await db.runAsync(
    `INSERT INTO screen_time_log (id, date, total_minutes, source, collected_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    date,
    totalMinutes,
    source,
    collectedAt
  );
  return { id, date, totalMinutes, source, collectedAt };
}

export async function getScreenTimeLogByDate(date: string): Promise<ScreenTimeLog | null> {
  const row = await db.getFirstAsync<ScreenTimeLogRow>(
    'SELECT * FROM screen_time_log WHERE date = ?',
    date
  );
  return row ? toModel(row) : null;
}

/** 10.6: 直近平均との比較用に、当日より前の直近N日分を取得 */
export async function listRecentScreenTimeLogs(
  beforeDateExclusive: string,
  days: number
): Promise<ScreenTimeLog[]> {
  const rows = await db.getAllAsync<ScreenTimeLogRow>(
    'SELECT * FROM screen_time_log WHERE date < ? ORDER BY date DESC LIMIT ?',
    beforeDateExclusive,
    days
  );
  return rows.map(toModel).reverse();
}
