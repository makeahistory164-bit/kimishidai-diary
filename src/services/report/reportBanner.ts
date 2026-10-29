import Storage from 'expo-sqlite/kv-store';
import { listDailyEntriesInRange } from '@/db/repositories/dailyEntryRepo';
import { monthRange, previousMonth } from './monthlyReport';

/**
 * 「先月のふりかえりレポートができました」バナーの表示判定。
 *
 * 【しつこくしないための条件 ★変更前に読むこと】
 * 想定ユーザーは「責められる・押しつけられると即アンインストールする層」
 * （PROJECT_STATE.md 1章）。購入の提案は、価値が実感できる時期に月1回までにする:
 *   - 月初の数日だけ出す（先月分がちょうど振り返れる時期）
 *   - 先月の記録が少ない人には出さない（見せるレポートの中身がない）
 *   - 閉じる・押すのどちらでも、その月はもう出さない
 * プラス購入済みの人にも同じバナーを出す。その場合はレポートへの案内になる。
 *
 * 閉じた記録は kv-store に置く。user_preference に列を足すとマイグレーションが要り、
 * このプロジェクトでは過去にマイグレーション事故が起きている（schema.ts 参照）ため。
 */

/** 毎月1日からこの日までだけ表示する */
export const BANNER_LAST_DAY_OF_MONTH = 7;
/** 先月の記録日数がこれ未満なら表示しない */
export const BANNER_MIN_RECORDED_DAYS = 5;

const DISMISSED_MONTH_KEY = 'monthlyReportBanner.dismissedMonth';

export interface ReportBannerTarget {
  year: number;
  month: number;
  recordedDays: number;
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 表示すべきなら対象月（先月）を返す。出さない場合は null。 */
export async function getReportBannerTarget(now: Date = new Date()): Promise<ReportBannerTarget | null> {
  if (now.getDate() > BANNER_LAST_DAY_OF_MONTH) return null;

  const [year, month] = previousMonth(now.getFullYear(), now.getMonth() + 1);
  if ((await Storage.getItem(DISMISSED_MONTH_KEY)) === toMonthKey(year, month)) return null;

  const [start, end] = monthRange(year, month);
  const entries = await listDailyEntriesInRange(start, end);
  const recordedDays = entries.filter((e) => e.axisScore !== null).length;
  if (recordedDays < BANNER_MIN_RECORDED_DAYS) return null;

  return { year, month, recordedDays };
}

/** その月のバナーを出さないようにする（閉じたとき・押したときの両方で呼ぶ） */
export async function dismissReportBanner(year: number, month: number): Promise<void> {
  await Storage.setItem(DISMISSED_MONTH_KEY, toMonthKey(year, month));
}
