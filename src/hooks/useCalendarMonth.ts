import { useCallback, useEffect, useState } from 'react';
import { listDailyEntriesInRange } from '@/db/repositories/dailyEntryRepo';
import { getUserPreference } from '@/db/repositories/userPreferenceRepo';
import { PREMIUM_UI_ENABLED } from '@/constants/releaseFlags';
import type { DailyEntry } from '@/types/models';

const FREE_RANGE_MONTHS = 3; // 12.2: 無料範囲は直近3ヶ月

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** 8.2 カレンダー画面のロジック（月遷移・無料範囲ゲーティング・当月分の実施状況取得） */
export function useCalendarMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    getUserPreference().then((pref) => setIsPremium(pref.premiumStatus !== 'free'));
  }, []);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const start = `${y}-${pad(m)}-01`;
      const end = `${y}-${pad(m)}-${pad(daysInMonth(y, m))}`;
      const rows = await listDailyEntriesInRange(start, end);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year, month);
  }, [year, month, load]);

  const isWithinFreeRange = useCallback(
    (y: number, m: number) => {
      const currentIndex = monthIndex(now.getFullYear(), now.getMonth() + 1);
      const targetIndex = monthIndex(y, m);
      const diff = currentIndex - targetIndex;
      return diff >= 0 && diff < FREE_RANGE_MONTHS;
    },
    [now]
  );

  /** @returns 'moved' | 'blocked'（無料範囲を超えるため8.6ペイウォールへ誘導すべき） */
  const goToPrevMonth = useCallback((): 'moved' | 'blocked' => {
    const prevIndex = monthIndex(year, month) - 1;
    const prevYear = Math.floor(prevIndex / 12);
    const prevMonth = (prevIndex % 12) + 1;
    // 課金導線を出さないリリースでは無料範囲の制限自体を適用しない（releaseFlags.ts 参照）
    if (PREMIUM_UI_ENABLED && !isPremium && !isWithinFreeRange(prevYear, prevMonth)) {
      return 'blocked';
    }
    setYear(prevYear);
    setMonth(prevMonth);
    return 'moved';
  }, [year, month, isPremium, isWithinFreeRange]);

  const goToNextMonth = useCallback((): 'moved' | 'blocked' => {
    const currentIndex = monthIndex(now.getFullYear(), now.getMonth() + 1);
    const nextIndex = monthIndex(year, month) + 1;
    if (nextIndex > currentIndex) return 'blocked'; // 未来の月へは進めない
    const nextYear = Math.floor(nextIndex / 12);
    const nextMonth = (nextIndex % 12) + 1;
    setYear(nextYear);
    setMonth(nextMonth);
    return 'moved';
  }, [year, month, now]);

  return { year, month, entries, loading, isPremium, goToPrevMonth, goToNextMonth };
}
