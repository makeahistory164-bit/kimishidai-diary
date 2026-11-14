import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listDailyEntriesInRange } from '@/db/repositories/dailyEntryRepo';
import { isPaywallEnabled } from '@/services/purchases';
import { usePremium } from '@/hooks/usePremium';
import { isWithinFreeRange } from '@/services/freeRange';
import type { DailyEntry } from '@/types/models';

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
  const isPremium = usePremium();

  const latestRequest = useRef(0);

  const load = useCallback(async (y: number, m: number, showSpinner: boolean) => {
    // 月を素早く切り替えたときに、古い月の結果で上書きしない
    const request = ++latestRequest.current;
    if (showSpinner) setLoading(true);
    try {
      const start = `${y}-${pad(m)}-01`;
      const end = `${y}-${pad(m)}-${pad(daysInMonth(y, m))}`;
      const rows = await listDailyEntriesInRange(start, end);
      if (request === latestRequest.current) setEntries(rows);
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year, month, true);
  }, [year, month, load]);

  // タブ画面は切り替えても破棄されないため、戻ってきたときに読み直さないと
  // 他のタブで記録した内容がカレンダーやレポート導線に反映されない。
  // スピナーを出すと戻るたびに画面がちらつくので、裏で更新する。
  useFocusEffect(
    useCallback(() => {
      load(year, month, false);
    }, [year, month, load])
  );

  /** @returns 'moved' | 'blocked'（無料範囲を超えるため8.6ペイウォールへ誘導すべき） */
  const goToPrevMonth = useCallback((): 'moved' | 'blocked' => {
    const prevIndex = monthIndex(year, month) - 1;
    const prevYear = Math.floor(prevIndex / 12);
    const prevMonth = (prevIndex % 12) + 1;
    // 購入手段がない環境では無料範囲の制限自体を適用しない（services/purchases 参照）
    if (isPaywallEnabled() && !isPremium && !isWithinFreeRange(prevYear, prevMonth, now)) {
      return 'blocked';
    }
    setYear(prevYear);
    setMonth(prevMonth);
    return 'moved';
  }, [year, month, isPremium, now]);

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
