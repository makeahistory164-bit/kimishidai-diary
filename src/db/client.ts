import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, migrateDbIfNeeded } from './schema';

/**
 * アプリ全体で共有するSQLite接続のシングルトン。
 * リポジトリ層はこのdbを直接importして使う（Reactツリー外でも呼べるようにするため
 * useSQLiteContext()は使わず、素の接続をここで一元管理する）。
 */
export const db = SQLite.openDatabaseSync(DATABASE_NAME);

let readyPromise: Promise<void> | null = null;

/** ルートレイアウト起動時に一度だけ呼び出し、マイグレーション完了を待つ */
export function ensureDbReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = migrateDbIfNeeded(db);
  }
  return readyPromise;
}
