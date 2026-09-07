import { db } from '../client';
import type { PremiumStatus, ReminderSettings, UserPreference } from '@/types/models';

const LOCAL_ID = 'local'; // 9.2: 端末につき1レコード想定

interface UserPreferenceRow {
  id: string;
  interest_themes: string;
  premium_status: PremiumStatus;
  premium_expires_at: string | null;
  notification_settings: string | null;
  onboarding_completed: number;
  screen_time_opt_in: number;
}

/**
 * notification_settingsはTEXT(JSON)なので、壊れた値・旧形式が入っていても
 * 画面を落とさないように検証してから返す。不正ならnull（＝未設定）扱い。
 * hour/minuteは通知トリガーへそのまま渡るため、範囲外の値を通さないことが重要。
 */
function parseReminderSettings(raw: string | null): ReminderSettings | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { enabled, hour, minute } = parsed as Record<string, unknown>;
    if (typeof enabled !== 'boolean') return null;
    if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) return null;
    if (!Number.isInteger(minute) || (minute as number) < 0 || (minute as number) > 59) return null;
    return { enabled, hour: hour as number, minute: minute as number };
  } catch {
    return null;
  }
}

function toModel(row: UserPreferenceRow): UserPreference {
  return {
    id: row.id,
    interestThemes: JSON.parse(row.interest_themes || '[]'),
    premiumStatus: row.premium_status,
    premiumExpiresAt: row.premium_expires_at,
    notificationSettings: parseReminderSettings(row.notification_settings),
    onboardingCompleted: row.onboarding_completed === 1,
    screenTimeOptIn: row.screen_time_opt_in === 1,
  };
}

async function ensureRow(): Promise<UserPreferenceRow> {
  const row = await db.getFirstAsync<UserPreferenceRow>(
    'SELECT * FROM user_preference WHERE id = ?',
    LOCAL_ID
  );
  if (row) return row;

  await db.runAsync(
    `INSERT INTO user_preference (id, interest_themes, premium_status, onboarding_completed, screen_time_opt_in)
     VALUES (?, '[]', 'free', 0, 0)`,
    LOCAL_ID
  );
  return {
    id: LOCAL_ID,
    interest_themes: '[]',
    premium_status: 'free',
    premium_expires_at: null,
    notification_settings: null,
    onboarding_completed: 0,
    screen_time_opt_in: 0,
  };
}

export async function getUserPreference(): Promise<UserPreference> {
  const row = await ensureRow();
  return toModel(row);
}

export async function updateInterestThemes(themes: string[]): Promise<void> {
  await ensureRow();
  await db.runAsync(
    'UPDATE user_preference SET interest_themes = ? WHERE id = ?',
    JSON.stringify(themes),
    LOCAL_ID
  );
}

export async function updateOnboardingCompleted(completed: boolean): Promise<void> {
  await ensureRow();
  await db.runAsync(
    'UPDATE user_preference SET onboarding_completed = ? WHERE id = ?',
    completed ? 1 : 0,
    LOCAL_ID
  );
}

export async function updateScreenTimeOptIn(optIn: boolean): Promise<void> {
  await ensureRow();
  await db.runAsync(
    'UPDATE user_preference SET screen_time_opt_in = ? WHERE id = ?',
    optIn ? 1 : 0,
    LOCAL_ID
  );
}

/** 8.5: 毎日のリマインダー設定を保存する */
export async function updateNotificationSettings(settings: ReminderSettings): Promise<void> {
  await ensureRow();
  await db.runAsync(
    'UPDATE user_preference SET notification_settings = ? WHERE id = ?',
    JSON.stringify(settings),
    LOCAL_ID
  );
}

/** 12章: 課金状況の更新（MVPではストア決済未接続のためスタブ的用途） */
export async function updatePremiumStatus(
  status: PremiumStatus,
  expiresAt: string | null
): Promise<void> {
  await ensureRow();
  await db.runAsync(
    'UPDATE user_preference SET premium_status = ?, premium_expires_at = ? WHERE id = ?',
    status,
    expiresAt,
    LOCAL_ID
  );
}
