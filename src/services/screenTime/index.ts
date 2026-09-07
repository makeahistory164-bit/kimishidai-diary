import { listRecentScreenTimeLogs } from '@/db/repositories/screenTimeLogRepo';
import { selfReportProvider } from './selfReportProvider';
import type { ScreenTimeProvider } from './types';

export type { ScreenTimeProvider } from './types';
export { recordSelfReportedMinutes } from './selfReportProvider';

/**
 * 現在有効なScreenTimeProviderを返す。
 * 将来ネイティブ実装（Android UsageStatsManager / iOS DeviceActivity）が
 * 使えるようになった場合は、ここのPlatform分岐だけを変更すればよい。
 * MVP時点ではiOS/Androidとも自己申告実装で統一している。
 */
export function getScreenTimeProvider(): ScreenTimeProvider {
  return selfReportProvider;
}

/**
 * 10.6: 「そのユーザー自身の直近の平均利用時間との比較」でscreen_time_vs_avgを算出する。
 * 絶対値基準ではなく個人内の変化を見る設計方針に沿う。
 * @returns 例: "+42%" / "-10%" 。比較に十分なデータがなければnull。
 */
export async function computeScreenTimeVsAverage(
  todayDateKey: string,
  todayMinutes: number | null
): Promise<string | null> {
  if (todayMinutes === null) return null;

  const recentLogs = await listRecentScreenTimeLogs(todayDateKey, 7);
  if (recentLogs.length === 0) return null;

  const avg = recentLogs.reduce((sum, log) => sum + log.totalMinutes, 0) / recentLogs.length;
  if (avg <= 0) return null;

  const diffPercent = Math.round(((todayMinutes - avg) / avg) * 100);
  return diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`;
}
