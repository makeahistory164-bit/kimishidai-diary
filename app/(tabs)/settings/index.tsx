import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { SCREEN_TIME_UI_ENABLED } from '@/constants/releaseFlags';
import { isPaywallEnabled } from '@/services/purchases';
import { usePremium } from '@/hooks/usePremium';
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
import { TYPE, SPACING, RADIUS, MIN_TAP, SCREEN_PADDING } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ListRow } from '@/components/ui/ListRow';
import { TextButton } from '@/components/ui/Button';

/** 8.5 設定画面 */
export default function SettingsScreen() {
  const { preference, refresh } = useUserPreference();
  const isPremium = usePremium();
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

  const premiumLabel = isPremium ? '購入済み' : '未購入（無料プラン）';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Section title="関心テーマ">
          <View style={styles.themeGrid}>
            {INTEREST_THEME_OPTIONS.map((theme) => {
              const active = preference.interestThemes.includes(theme);
              return (
                <Pressable
                  key={theme}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  onPress={() => toggleTheme(theme)}
                  accessibilityRole="button"
                  // 選択を背景色だけで表していたので、非視覚的にも伝わるようにする
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                    {theme}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* スクリーンタイム連携は初回リリースでは出さない（releaseFlags.ts 参照） */}
        {SCREEN_TIME_UI_ENABLED && (
          <Section title="スクリーンタイム連携">
          <ListRow
            kind="switch"
            label="スクリーンタイムを記録する"
            sublabel="自己申告。OSからの自動取得は行いません"
            value={preference.screenTimeOptIn}
            onValueChange={toggleScreenTimeOptIn}
          />
          {preference.screenTimeOptIn && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.helperText}>
                今日の記録: {todayMinutes !== null ? `${todayMinutes}分` : '未入力'}
              </Text>
              {showScreenTimeInput ? (
                <ScreenTimeInput initialMinutes={todayMinutes} onSubmit={handleSubmitMinutes} />
              ) : (
                <TextButton
                  label="今日の利用時間を入力／更新する"
                  onPress={() => setShowScreenTimeInput(true)}
                />
              )}
            </View>
            )}
          </Section>
        )}

        {/* 購入手段がない環境では課金導線を出さない（services/purchases 参照） */}
        {isPaywallEnabled() && (
          <Section title="プラス">
            <ListRow
              kind="navigation"
              label={premiumLabel}
              onPress={() => router.push('/paywall')}
            />
          </Section>
        )}

        {/* データ管理（エクスポート）はストア審査でプレースホルダと見なされないよう、
            機能が実装できるまでセクションごと出さない。要件書12.3ではPremium機能。 */}

        <Section title="通知">
          <ListRow
            kind="switch"
            label="ふりかえりのリマインダー"
            sublabel={reminder.enabled ? `毎日 ${formatReminderTime(reminder)} にお知らせ` : undefined}
            value={reminder.enabled}
            onValueChange={(enabled) => applyReminder({ ...reminder, enabled })}
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
              <TextButton label="端末の設定を開く" onPress={() => Linking.openSettings()} />
            </View>
          )}
        </Section>

        <Section title="法務・ポリシー">
          <ListRow kind="navigation" label="利用規約" onPress={() => router.push('/legal/terms')} />
          <ListRow
            kind="navigation"
            label="プライバシーポリシー"
            onPress={() => router.push('/legal/privacy')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <Card>{children}</Card>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  content: { padding: SCREEN_PADDING, paddingBottom: SPACING.xxl * 2, gap: SPACING.xl },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  themeChip: {
    minHeight: MIN_TAP,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  themeChipActive: { backgroundColor: NEUTRAL_COLORS.accent, borderColor: NEUTRAL_COLORS.accent },
  themeChipText: { ...TYPE.subhead, color: NEUTRAL_COLORS.textPrimary },
  themeChipTextActive: { color: NEUTRAL_COLORS.onAccent },
  helperText: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
});
