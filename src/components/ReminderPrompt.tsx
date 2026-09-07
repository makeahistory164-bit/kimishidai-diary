import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { ReminderTimePicker } from './ReminderTimePicker';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { DEFAULT_REMINDER_SETTINGS } from '@/types/models';
import { saveAndScheduleReminder } from '@/services/notifications/reminderService';

/**
 * 1日目を書き終えた直後に、リマインダーを設定するか聞くカード。
 *
 * 【なぜオンボーディングではなくここなのか ★変更前に読むこと】
 * iOSの通知許可は一度拒否されると canAskAgain=false になり、二度とダイアログを出せない。
 * 起動直後は「何のアプリかまだ分かっていない」状態なので拒否されやすく、そこで
 * 許可を消費すると、リマインダーを永久に使えないユーザーを自分で作ることになる。
 * ふりかえりを1回やり終えた直後なら価値が伝わっているため、同じ許可要求でも通りやすい。
 *
 * 【表示条件】UserPreference.notificationSettings が null（＝まだ一度も答えていない）のときだけ。
 * 「あとで」を押した場合も enabled:false として保存するので、null でなくなり二度と出ない。
 * しつこく出さないことが目的なので、この保存を省いてはいけない。
 *
 * 【時刻を先に選ばせる理由】
 * トグルを押した瞬間にOSダイアログが出る作りだと、ユーザーは「何時に鳴るか」を
 * 決める前に許可を迫られる。先に時刻を決めてから1タップで確定させることで、
 * 許可要求が「自分で決めたことの確定」として提示される。
 */
interface Props {
  /** 設定を保存したあと、呼び出し元が UserPreference を読み直すためのコールバック */
  onDone: () => void;
}

export function ReminderPrompt({ onDone }: Props) {
  const [hour, setHour] = useState(DEFAULT_REMINDER_SETTINGS.hour);
  const [minute, setMinute] = useState(DEFAULT_REMINDER_SETTINGS.minute);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await saveAndScheduleReminder({ enabled: true, hour, minute });
      if (result === 'denied') {
        // 端末側で拒否された。saveAndScheduleReminder が enabled:false で保存済みなので
        // カード自体は次回から出ない。ここでは設定への導線だけ見せる。
        setPermissionDenied(true);
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  /** 「あとで」も明示的にoffとして保存する（nullのままだと毎回出てしまう） */
  const dismiss = async () => {
    setBusy(true);
    try {
      await saveAndScheduleReminder({ enabled: false, hour, minute });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  if (permissionDenied) {
    return (
      <View style={styles.card}>
        <Text style={styles.body}>
          端末側で通知がオフになっているため、おしらせできません。
          設定画面からいつでもオンにできます。
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.secondaryButtonText}>端末の設定を開く</Text>
          </Pressable>
          <Pressable style={styles.laterButton} onPress={onDone}>
            <Text style={styles.laterText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>明日も、ふりかえりませんか？</Text>
      <Text style={styles.body}>
        決めた時間に、そっとおしらせします。あとから変更もオフにもできます。
      </Text>

      <ReminderTimePicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={enable} disabled={busy}>
          <Text style={styles.primaryButtonText}>この時間におしらせ</Text>
        </Pressable>
        <Pressable style={styles.laterButton} onPress={dismiss} disabled={busy}>
          <Text style={styles.laterText}>あとで</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    padding: 20,
    gap: 10,
    marginTop: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  body: { fontSize: 14, lineHeight: 22, color: NEUTRAL_COLORS.textSecondary },
  actions: { gap: 8, marginTop: 6 },
  primaryButton: {
    backgroundColor: NEUTRAL_COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    alignItems: 'center',
  },
  secondaryButtonText: { color: NEUTRAL_COLORS.textPrimary, fontWeight: '600' },
  laterButton: { paddingVertical: 10, alignItems: 'center' },
  laterText: { color: NEUTRAL_COLORS.textSecondary, fontSize: 14 },
});
