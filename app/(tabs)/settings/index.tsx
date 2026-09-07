import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { PREMIUM_UI_ENABLED } from '@/constants/releaseFlags';
import {
  DEFAULT_REMINDER_SETTINGS,
  INTEREST_THEME_OPTIONS,
  type ReminderSettings,
} from '@/types/models';
import { useUserPreference } from '@/hooks/useUserPreference';
import {
  updateInterestThemes,
  updateScreenTimeOptIn,
} from '@/db/repositories/userPreferenceRepo';
import { getScreenTimeLogByDate } from '@/db/repositories/screenTimeLogRepo';
import { recordSelfReportedMinutes } from '@/services/screenTime';
import { ScreenTimeInput } from '@/components/ScreenTimeInput';
import { ReminderTimePicker } from '@/components/ReminderTimePicker';
import { formatReminderTime, saveAndScheduleReminder } from '@/services/notifications/reminderService';
import { toDateKey } from '@/lib/id';

/** 8.5 設定画面 */
export default function SettingsScreen() {
  const { preference, refresh } = useUserPreference();
  const [todayMinutes, setTodayMinutes] = useState<number | null>(null);
  const [showScreenTimeInput, setShowScreenTimeInput] = useState(false);
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadTodayScreenTime = useCallback(async () => {
    const log = await getScreenTimeLogByDate(toDateKey(new Date()));
    setTodayMinutes(log?.totalMinutes ?? null);
  }, []);

  useEffect(() => {
    loadTodayScreenTime();
  }, [loadTodayScreenTime]);

  // DBの設定を画面のローカル状態へ取り込む（未設定なら既定値21:00・オフ）
  useEffect(() => {
    if (preference) {
      setReminder(preference.notificationSettings ?? DEFAULT_REMINDER_SETTINGS);
    }
  }, [preference]);

  /**
   * 保存と通知予約は必ずセットで行う（reminderService側で担保）。
   * 通知が許可されなかった場合はオフへ戻し、「オンに見えるのに鳴らない」状態を作らない。
   */
  const applyReminder = useCallback(
    async (next: ReminderSettings) => {
      setReminder(next); // 操作感を落とさないための楽観的更新
      const result = await saveAndScheduleReminder(next);
      if (result === 'denied') {
        setReminder({ ...next, enabled: false });
        setPermissionDenied(true);
      } else {
        setPermissionDenied(false);
      }
      await refresh();
    },
    [refresh]
  );

  if (!preference) return null;

  const toggleTheme = async (theme: string) => {
    const next = preference.interestThemes.includes(theme)
      ? preference.interestThemes.filter((t) => t !== theme)
      : [...preference.interestThemes, theme];
    await updateInterestThemes(next);
    await refresh();
  };

  const toggleScreenTimeOptIn = async () => {
    const next = !preference.screenTimeOptIn;
    await updateScreenTimeOptIn(next);
    await refresh();
    if (next) setShowScreenTimeInput(true);
  };

  const handleSubmitMinutes = async (minutes: number) => {
    await recordSelfReportedMinutes(minutes);
    setTodayMinutes(minutes);
    setShowScreenTimeInput(false);
  };

  const premiumLabel =
    preference.premiumStatus === 'premium_active'
      ? 'プレミアム加入中'
      : preference.premiumStatus === 'premium_trial'
        ? 'トライアル中'
        : '未加入（無料プラン）';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>設定</Text>

        <Section title="関心テーマ" icon="🎯">
          <View style={styles.themeGrid}>
            {INTEREST_THEME_OPTIONS.map((theme) => {
              const active = preference.interestThemes.includes(theme);
              return (
                <Pressable
                  key={theme}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  onPress={() => toggleTheme(theme)}
                >
                  <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                    {theme}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="スクリーンタイム連携" icon="⏱️">
          <Row
            label={preference.screenTimeOptIn ? '連携済み（自己申告）' : '未連携'}
            onPress={toggleScreenTimeOptIn}
            trailing={preference.screenTimeOptIn ? 'オフにする' : 'オンにする'}
          />
          {preference.screenTimeOptIn && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.helperText}>
                今日の記録: {todayMinutes !== null ? `${todayMinutes}分` : '未入力'}
              </Text>
              {showScreenTimeInput ? (
                <ScreenTimeInput initialMinutes={todayMinutes} onSubmit={handleSubmitMinutes} />
              ) : (
                <Pressable onPress={() => setShowScreenTimeInput(true)}>
                  <Text style={styles.linkText}>今日の利用時間を入力/更新する</Text>
                </Pressable>
              )}
            </View>
          )}
        </Section>

        {/* 課金導線はストア決済を実装するまで出さない（releaseFlags.ts 参照） */}
        {PREMIUM_UI_ENABLED && (
          <Section title="プレミアム" icon="✨">
            <Row
              label={premiumLabel}
              onPress={() => router.push('/paywall')}
              trailing={preference.premiumStatus === 'free' ? '詳しく見る' : '管理する'}
            />
          </Section>
        )}

        {/* データ管理（エクスポート）はストア審査でプレースホルダと見なされないよう、
            機能が実装できるまでセクションごと出さない。要件書12.3ではPremium機能。 */}

        <Section title="通知" icon="🔔">
          <Row
            label={
              reminder.enabled
                ? `毎日 ${formatReminderTime(reminder)} にお知らせ`
                : 'ふりかえりのリマインダー'
            }
            onPress={() => applyReminder({ ...reminder, enabled: !reminder.enabled })}
            trailing={reminder.enabled ? 'オフにする' : 'オンにする'}
          />
          {reminder.enabled && (
            <ReminderTimePicker
              hour={reminder.hour}
              minute={reminder.minute}
              onChange={(hour, minute) => applyReminder({ ...reminder, hour, minute })}
            />
          )}
          {permissionDenied && (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.helperText}>
                端末側で通知がオフになっているため、お知らせできません。
              </Text>
              <Pressable onPress={() => Linking.openSettings()}>
                <Text style={styles.linkText}>端末の設定を開く</Text>
              </Pressable>
            </View>
          )}
        </Section>

        <Section title="法務・ポリシー" icon="📄">
          <Row label="利用規約" onPress={() => router.push('/legal/terms')} trailing="開く" />
          <Row
            label="プライバシーポリシー"
            onPress={() => router.push('/legal/privacy')}
            trailing="開く"
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  label,
  trailing,
  onPress,
  disabled,
}: {
  label: string;
  trailing: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={disabled || !onPress}>
      <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
      <Text style={[styles.rowTrailing, disabled && styles.rowLabelDisabled]}>{trailing}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  content: { padding: 20, paddingBottom: 60, gap: 20 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  section: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  themeChipActive: { backgroundColor: NEUTRAL_COLORS.accent, borderColor: NEUTRAL_COLORS.accent },
  themeChipText: { color: NEUTRAL_COLORS.textPrimary, fontSize: 13 },
  themeChipTextActive: { color: '#FFFFFF' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { fontSize: 14, color: NEUTRAL_COLORS.textPrimary },
  rowLabelDisabled: { color: NEUTRAL_COLORS.textSecondary },
  rowTrailing: { fontSize: 13, color: NEUTRAL_COLORS.accent, fontWeight: '600' },
  helperText: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, marginBottom: 8 },
  linkText: { fontSize: 13, color: NEUTRAL_COLORS.accent, fontWeight: '600' },
});
