import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * 要件定義書 9.2 テーブル定義に対応するSQLiteスキーマ。
 * カラム名はDB側snake_case、アプリ側はcamelCaseにリポジトリ層でマッピングする。
 *
 * UserPreferenceには9.2に明記のないonboarding_completed / screen_time_opt_in を
 * 追加している（8.4オンボーディング完了判定・10.6スクリーンタイム同意管理に
 * 実装上必要なため。要件の趣旨（端末につき1レコード）を損なわない範囲の拡張）。
 */
const DATABASE_VERSION = 2;

/**
 * マイグレーションを実行する。
 *
 * 【重要】user_version は「各ステップが完了した直後に、そのステップの到達バージョンを」
 * 書き込む。最後にまとめて DATABASE_VERSION を書くと、途中のステップが未実装・未実行でも
 * バージョンだけが進んでしまい、そのステップが永久にスキップされる（実際に開発中に
 * todoテーブルが作られないまま user_version だけ 2 になる事故が起きた）。
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS daily_entry (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL UNIQUE,
        axis_score INTEGER,
        status TEXT NOT NULL DEFAULT 'not_started',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS question (
        id TEXT PRIMARY KEY NOT NULL,
        daily_entry_id TEXT NOT NULL REFERENCES daily_entry(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        category TEXT NOT NULL,
        polarity TEXT NOT NULL,
        source TEXT NOT NULL,
        display_order INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_question_daily_entry_id ON question(daily_entry_id);

      CREATE TABLE IF NOT EXISTS answer (
        id TEXT PRIMARY KEY NOT NULL,
        question_id TEXT NOT NULL UNIQUE REFERENCES question(id) ON DELETE CASCADE,
        value INTEGER NOT NULL,
        memo TEXT,
        feedback TEXT,
        response_time_seconds INTEGER,
        answered_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_preference (
        id TEXT PRIMARY KEY NOT NULL,
        interest_themes TEXT NOT NULL DEFAULT '[]',
        premium_status TEXT NOT NULL DEFAULT 'free',
        premium_expires_at TEXT,
        notification_settings TEXT,
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        screen_time_opt_in INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS screen_time_log (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL UNIQUE,
        total_minutes INTEGER NOT NULL,
        source TEXT NOT NULL,
        collected_at TEXT NOT NULL
      );
    `);
    await db.execAsync('PRAGMA user_version = 1');
    currentVersion = 1;
  }

  if (currentVersion === 1) {
    // v2: TODOリスト機能。done_for（誰のためにやったか）はユーザーが完了時に選択する。
    // 軸スコアには使わず、振り返りの記録とAI質問生成の材料としてのみ使う（models.ts参照）。
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        text TEXT NOT NULL,
        done_for TEXT,
        completed_at TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_todo_date ON todo(date);
    `);
    await db.execAsync('PRAGMA user_version = 2');
    currentVersion = 2;
  }
}

export const DATABASE_NAME = 'kimishidai.db';
