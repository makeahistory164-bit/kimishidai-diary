import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadEntryDetailByDate } from '@/services/dailyEntryService';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { GradientScoreBar } from '@/components/GradientScoreBar';
import { QuestionCard } from '@/components/QuestionCard';
import { SCALE_LABELS } from '@/components/AnswerScale';
import { normalizeAnswerValue, applyPolarity } from '@/services/axisScore';
import { getAxisScoreColor, NEUTRAL_COLORS } from '@/constants/colors';
import { toDateKey, formatDateLabel } from '@/lib/id';
import type { DailyEntryDetail } from '@/types/models';

/** 8.3 日別詳細画面。当日のみ編集可、過去日は閲覧のみ。 */
export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateKey = Array.isArray(date) ? date[0] : date;
  const isToday = dateKey === toDateKey(new Date());

  if (isToday) {
    // 当日は「今日の質問」画面と同じ編集可能なロジックを共有する
    return <TodayEditableView />;
  }
  return <ReadOnlyDayView dateKey={dateKey} />;
}

function TodayEditableView() {
  const { entry, loading, answerValue, answerMemo, feedback } = useTodayEntry();

  if (loading || !entry) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <GradientScoreBar score={entry.axisScore} />
        {entry.questions.length === 0 ? (
          <Text style={styles.emptyText}>まだ今日の質問を始めていません。</Text>
        ) : (
          entry.questions.map((q, i) => (
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReadOnlyDayView({ dateKey }: { dateKey: string }) {
  const [entry, setEntry] = useState<DailyEntryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await loadEntryDetailByDate(dateKey);
      setEntry(detail);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: formatDateLabel(dateKey) }} />
        <View style={styles.content}>
          <Text style={styles.emptyText}>この日は記録がありません（未実施）。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 日付はヘッダーのtitleに出す。画面内にも見出しを置くと二重になる */}
      <Stack.Screen options={{ title: formatDateLabel(dateKey) }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <GradientScoreBar score={entry.axisScore} />

        {entry.questions.map((q, i) => {
          const dotColor = q.answer
            ? getAxisScoreColor(applyPolarity(normalizeAnswerValue(q.answer.value), q.polarity))
            : NEUTRAL_COLORS.border;
          return (
            <View key={q.id} style={styles.readonlyCard}>
              <View style={styles.readonlyHeader}>
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <Text style={styles.readonlyIndex}>
                  {i + 1} / {entry.questions.length}
                </Text>
              </View>
              <Text style={styles.readonlyQuestion}>{q.text}</Text>
              <Text style={styles.readonlyAnswer}>
                {q.answer ? SCALE_LABELS[q.answer.value - 1] : '未回答'}
              </Text>
              {q.answer?.memo ? <Text style={styles.readonlyMemo}>「{q.answer.memo}」</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16 },
  dateHeading: { fontSize: 16, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  emptyText: { fontSize: 14, color: NEUTRAL_COLORS.textSecondary },
  readonlyCard: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    gap: 8,
  },
  readonlyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  readonlyIndex: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  readonlyQuestion: { fontSize: 16, fontWeight: '600', color: NEUTRAL_COLORS.textPrimary },
  readonlyAnswer: { fontSize: 14, color: NEUTRAL_COLORS.textPrimary },
  readonlyMemo: { fontSize: 13, color: NEUTRAL_COLORS.textSecondary, fontStyle: 'italic' },
});
