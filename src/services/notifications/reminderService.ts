import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getUserPreference, updateNotificationSettings } from '@/db/repositories/userPreferenceRepo';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from '@/types/models';

/**
 * 8.5: 毎日のふりかえりリマインダー（ローカル通知）。
 *
 * 【なぜローカル通知だけなのか】
 * プッシュ通知（Expo Push / FCM）はサーバーと認証情報が必要になり、第0段階の
 * 「コスト0円・サーバーなし」方針（PROJECT_STATE.md 2章）と噛み合わない。
 * 「決まった時刻に自分へ思い出させる」用途は端末内で完結するため、ローカル通知で足りる。
 *
 * 【トリガーの選定 ★変更前に読むこと】
 * iOS/Android 共通で SchedulableTriggerInputTypes.DAILY を使っている。
 * 公式ドキュメントの型リファレンスでは DailyTriggerInput に「Android」の
 * プラットフォームバッジが付いており iOS 非対応に読めるが、これは誤解を招く表記で、
 * iOSネイティブ実装にも分岐がある（SchedulerModule.swift の
 * dailyNotificationTriggerType → DailyTriggerRecord → UNCalendarNotificationTrigger）。
 * 実機・シミュレータともiOSで動作するため、iOS用にCALENDARトリガーへ分岐させる必要はない。
 * 分岐させると「毎日繰り返す」ために repeats:true を別途指定する必要が生じ、
 * 指定漏れで1回しか鳴らない事故につながる。
 */

/**
 * 固定IDで登録する。毎回同じIDを使うことで、設定変更時に
 * 「前の予約を消し忘れて二重に鳴る」事故を構造的に防ぐ。
 */
const REMINDER_IDENTIFIER = 'daily-reflection-reminder';
const ANDROID_CHANNEL_ID = 'daily-reminder';

/**
 * 通知文言。要件書8.4「責めない・寄り添う語り口」に従う。
 *
 * 繰り返し通知は内容を後から差し替えられないため、
 * 「まだ書いていない人」にも「もう書いた人」にも失礼にならない中立な文にしている。
 * 「書き忘れていませんか」「続けましょう」のような催促・説教は、
 * 想定ユーザー（日記が続かなかった経験のある層）を最も確実に離脱させるため使わない。
 */
const REMINDER_CONTENT = {
  title: 'おつかれさま。今日はどんな一日だった？',
  body: '5つの質問に答えるだけ。書けない日があっても大丈夫。',
};

/** 通知はネイティブのみ。web（expo start --web）では何もしない */
function isSupportedPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function formatReminderTime(settings: Pick<ReminderSettings, 'hour' | 'minute'>): string {
  const hh = String(settings.hour).padStart(2, '0');
  const mm = String(settings.minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * 通知の表示方法。アプリを開いている最中に鳴っても画面上部に出るようにする。
 * SDK 57ではshouldShowBanner/shouldShowListが必須（旧shouldShowAlertは廃止）。
 */
export function configureNotificationHandler(): void {
  if (!isSupportedPlatform()) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Android 8.0+ は通知チャンネルがないと通知が表示されない */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '毎日のふりかえり',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported';

/**
 * 通知許可を確認し、未許可なら1度だけOSダイアログを出す。
 * 一度拒否されるとOSは二度とダイアログを出さない（canAskAgain=false）ため、
 * その場合は呼び出し側で「端末の設定から許可してください」と案内する。
 */
export async function ensureNotificationPermission(): Promise<PermissionResult> {
  if (!isSupportedPlatform()) return 'unsupported';

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? 'granted' : 'denied';
}

export async function cancelReminder(): Promise<void> {
  if (!isSupportedPlatform()) return;
  // 未登録IDのキャンセルは例外を投げうるので握りつぶす（結果は同じ＝予約がない状態）
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => undefined);
}

/**
 * リマインダーを予約し直す。既存の予約は必ず消してから登録する。
 *
 * @returns 実際に予約できたか（通知が未許可なら false）
 */
export async function scheduleReminder(settings: ReminderSettings): Promise<PermissionResult> {
  if (!isSupportedPlatform()) return 'unsupported';

  if (!settings.enabled) {
    await cancelReminder();
    return 'granted';
  }

  const permission = await ensureNotificationPermission();
  if (permission !== 'granted') {
    await cancelReminder();
    return permission;
  }

  await ensureAndroidChannel();
  await cancelReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: REMINDER_CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
      // iOSでは無視されるため、プラットフォーム分岐は不要
      channelId: ANDROID_CHANNEL_ID,
    },
  });
  return 'granted';
}

/** 設定を保存し、同じ内容で通知予約も更新する（保存と予約のズレを防ぐため必ず対で行う） */
export async function saveAndScheduleReminder(
  settings: ReminderSettings
): Promise<PermissionResult> {
  const result = await scheduleReminder(settings);
  // 許可が下りなかった場合はオフとして保存し、UIの表示と実態を一致させる
  const persisted: ReminderSettings =
    result === 'denied' ? { ...settings, enabled: false } : settings;
  await updateNotificationSettings(persisted);
  return result;
}

/**
 * 起動時に、DBの設定内容どおりに通知が予約されている状態へ揃える。
 *
 * OS再起動・アプリ再インストール・端末設定での通知オフなどで予約は消えうるため、
 * 「DBがオンなら毎回予約し直す」ことで実態を設定に追従させる。
 * 予約は固定IDなので、毎回呼んでも重複しない。
 */
export async function syncReminderOnLaunch(): Promise<void> {
  if (!isSupportedPlatform()) return;
  try {
    const preference = await getUserPreference();
    const settings = preference.notificationSettings ?? DEFAULT_REMINDER_SETTINGS;
    if (!settings.enabled) return;

    // 起動時に許可ダイアログを勝手に出さない。既に許可済みのときだけ予約し直す。
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) return;

    await ensureAndroidChannel();
    await cancelReminder();
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: REMINDER_CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  } catch (error) {
    // 通知はアプリの主機能ではないため、失敗しても起動を妨げない
    console.warn('[reminderService] リマインダーの再予約に失敗しました', error);
  }
}
