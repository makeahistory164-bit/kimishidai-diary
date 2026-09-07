import { Platform } from 'react-native';
import { getScreenTimeLogByDate, upsertScreenTimeLog } from '@/db/repositories/screenTimeLogRepo';
import { toDateKey } from '@/lib/id';
import type { ScreenTimeProvider } from './types';

/**
 * MVPの標準実装: OSからの自動取得ではなく、ユーザーが設定/オンボーディング画面で
 * 入力した値をローカルDBから読み出すだけの「自己申告」プロバイダ。
 * 実際の入力UIは src/components/ScreenTimeInput.tsx が担う。
 */
export const selfReportProvider: ScreenTimeProvider = {
  isNativeMeasurement: false,
  async getTodayMinutes() {
    const today = toDateKey(new Date());
    const log = await getScreenTimeLogByDate(today);
    return log?.totalMinutes ?? null;
  },
};

/** ユーザーが入力した当日のスクリーンタイム（分）を保存する */
export async function recordSelfReportedMinutes(minutes: number): Promise<void> {
  const today = toDateKey(new Date());
  const source = Platform.OS === 'android' ? 'android' : 'ios';
  await upsertScreenTimeLog(today, minutes, source);
}
