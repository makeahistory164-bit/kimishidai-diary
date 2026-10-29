import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { useUserPreference } from '@/hooks/useUserPreference';
import { ReminderPrompt } from '@/components/ReminderPrompt';
import { QuestionCard } from '@/components/QuestionCard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { GradientScoreBar } from '@/components/GradientScoreBar';
import { MascotSpeech } from '@/components/MascotSpeech';
import { MonthlyReportBanner } from '@/components/MonthlyReportBanner';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, SPACING, RADIUS, MIN_TAP, SCREEN_PADDING } from '@/constants/theme';

/**
 * 8.1 ホーム / 今日の質問画面。
 * DailyEntry.statusに応じて not_started / in_progress / completed の3状態を出し分ける。
 */
export default function HomeScreen() {
  const { entry, loading, generating, error, start, answerValue, answerMemo, feedback } =
    useTodayEntry();
  const { preference, refresh: refreshPreference } = useUserPreference();
  const [editingAfterCompletion, setEditingAfterCompletion] = useState(false);

  if (loading || !entry) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </SafeAreaView>
    );
  }

  const answeredCount = entry.questions.filter((q) => q.answer !== null).length;
  // 最初の未回答＝いまキャラが尋ねている問い。すべて回答済みなら -1（誰にも出さない）
  const askingIndex = entry.questions.findIndex((q) => q.answer === null);
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>

        {entry.status === 'not_started' && (
          <View style={styles.centerBlock}>
            {/* 画面の地の上に置くので、抜き色は surface ではなく background を渡す */}
            <MascotSpeech
              expression="cheer"
              surfaceColor={NEUTRAL_COLORS.background}
              bubbleColor={NEUTRAL_COLORS.surface}
              size={64}
            >
              <Text style={styles.heading}>今日一日、自分軸で過ごせましたか？</Text>
              <Text style={styles.body}>
                今日の質問を5問お届けします。答えは4段階評価と、書きたければ一言メモだけ。
              </Text>
            </MascotSpeech>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={styles.primaryButton}
              onPress={start}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={NEUTRAL_COLORS.onAccent} />
              ) : (
                <Text style={styles.primaryButtonText}>今日の質問を始める</Text>
              )}
            </Pressable>
          </View>
        )}

        {entry.status === 'in_progress' && (
          <View style={{ gap: 16 }}>
            <ProgressIndicator answered={answeredCount} total={entry.questions.length} />
            {entry.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                total={entry.questions.length}
                asking={i === askingIndex}
                editable
                onAnswerValue={(v) => answerValue(q.id, v)}
                onAnswerMemo={(m) => answerMemo(q.id, m)}
                onFeedback={(f) => feedback(q.id, f)}
              />
            ))}
          </View>
        )}

        {entry.status === 'completed' && !editingAfterCompletion && (
          <View style={styles.centerBlock}>
            {/* 労いは表情'joy'固定。スコアの高低で表情を変えない（要件書8.4「責めない」） */}
            <MascotSpeech
              expression="joy"
              surfaceColor={NEUTRAL_COLORS.background}
              bubbleColor={NEUTRAL_COLORS.surface}
              size={64}
            >
              <Text style={styles.heading}>今日の振り返り、お疲れさまでした</Text>
            </MascotSpeech>
            <GradientScoreBar score={entry.axisScore} />

            {/* ふりかえりを1回やり終えた直後だけリマインダーを聞く。
                notificationSettings が null＝まだ一度も答えていないときのみ表示され、
                「あとで」を押しても off として保存されるので二度は出ない。 */}
            {preference?.notificationSettings == null && (
              <ReminderPrompt onDone={refreshPreference} />
            )}

            {/* 月初に1回だけの、先月のレポートの案内。リマインダーの質問と同時には出さない
                （一度に2つ頼みごとをされる画面にしないため）。表示条件は reportBanner.ts */}
            {preference != null && preference.notificationSettings != null && (
              <MonthlyReportBanner />
            )}

            <View style={styles.completedActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setEditingAfterCompletion(true)}>
                <Text style={styles.secondaryButtonText}>回答を見直す（当日中のみ）</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/calendar')}>
                <Text style={styles.secondaryButtonText}>カレンダーで見る</Text>
              </Pressable>
            </View>
          </View>
        )}

        {entry.status === 'completed' && editingAfterCompletion && (
          <View style={{ gap: 16 }}>
            <ProgressIndicator answered={answeredCount} total={entry.questions.length} />
            {entry.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                total={entry.questions.length}
                editable
                onAnswerValue={(v) => answerValue(q.id, v)}
                onAnswerMemo={(m) => answerMemo(q.id, m)}
                onFeedback={(f) => feedback(q.id, f)}
              />
            ))}
            <Pressable style={styles.secondaryButton} onPress={() => setEditingAfterCompletion(false)}>
              <Text style={styles.secondaryButtonText}>閉じる</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: SCREEN_PADDING, paddingBottom: SPACING.xxl * 2, gap: SPACING.lg },
  dateLabel: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
  centerBlock: { gap: SPACING.lg, paddingVertical: SPACING.xl },
  heading: { ...TYPE.title3, color: NEUTRAL_COLORS.textPrimary },
  body: { ...TYPE.callout, color: NEUTRAL_COLORS.textSecondary },
  errorText: { ...TYPE.footnote, color: NEUTRAL_COLORS.danger },
  primaryButton: {
    minHeight: MIN_TAP,
    backgroundColor: NEUTRAL_COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...TYPE.headline, color: NEUTRAL_COLORS.onAccent },
  completedActions: { gap: SPACING.md, marginTop: SPACING.sm },
  secondaryButton: {
    minHeight: MIN_TAP,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { ...TYPE.headline, color: NEUTRAL_COLORS.textPrimary },
});
