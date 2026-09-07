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
import { NEUTRAL_COLORS } from '@/constants/colors';

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
                <ActivityIndicator color="#FFFFFF" />
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
  scrollContent: { padding: 20, paddingBottom: 60, gap: 16 },
  dateLabel: { fontSize: 13, color: NEUTRAL_COLORS.textSecondary },
  centerBlock: { gap: 16, paddingVertical: 24 },
  heading: { fontSize: 20, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  body: { fontSize: 14, color: NEUTRAL_COLORS.textSecondary, lineHeight: 22 },
  errorText: { fontSize: 13, color: '#C0392B' },
  primaryButton: {
    backgroundColor: NEUTRAL_COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  completedActions: { gap: 10, marginTop: 8 },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    alignItems: 'center',
  },
  secondaryButtonText: { color: NEUTRAL_COLORS.textPrimary, fontWeight: '600' },
});
