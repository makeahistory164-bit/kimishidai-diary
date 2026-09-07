import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendarMonth } from '@/hooks/useCalendarMonth';
import { useShareCalendar } from '@/hooks/useShareCalendar';
import { CalendarGrid } from '@/components/CalendarGrid';
import { ShareableCalendarCard } from '@/components/ShareableCalendarCard';
import { NEUTRAL_COLORS, AXIS_GRADIENT_COLORS } from '@/constants/colors';
import { PREMIUM_UI_ENABLED } from '@/constants/releaseFlags';

/** 8.2 カレンダー画面 */
export default function CalendarScreen() {
  const { year, month, entries, loading, isPremium, goToPrevMonth, goToNextMonth } =
    useCalendarMonth();
  const { cardRef, share, sharing } = useShareCalendar();

  const recordedDays = entries.filter((e) => e.axisScore !== null).length;

  const handlePrev = () => {
    if (goToPrevMonth() === 'blocked') {
      router.push('/paywall');
    }
  };
  const handleNext = () => {
    goToNextMonth();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={handlePrev} hitSlop={12}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {year}年 {month}月
          </Text>
          <Pressable onPress={handleNext} hitSlop={12}>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>

        {PREMIUM_UI_ENABLED && !isPremium && (
          <Text style={styles.freeRangeNote}>無料プランでは直近3ヶ月分を閲覧できます</Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            entries={entries}
            onSelectDate={(dateKey) => router.push(`/day/${dateKey}`)}
          />
        )}

        <View style={styles.legend}>
          <Text style={styles.legendLabel}>軸がブレた日</Text>
          <View style={styles.legendBar}>
            {AXIS_GRADIENT_COLORS.map((c) => (
              <View key={c} style={[styles.legendChip, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={styles.legendLabel}>自分軸を保てた日</Text>
        </View>

        {/* 記録が1日もない月は共有しても意味がないので出さない */}
        {!loading && recordedDays > 0 && (
          <Pressable
            style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
            onPress={share}
            disabled={sharing}
          >
            <Text style={styles.shareButtonText}>
              {sharing ? '準備中…' : 'この月を画像で共有する'}
            </Text>
          </Pressable>
        )}
        {!loading && recordedDays > 0 && (
          <Text style={styles.shareNote}>
            共有される画像に、質問や回答の中身は含まれません。色と記録日数だけです。
          </Text>
        )}
      </ScrollView>

      {/*
        キャプチャ専用のカード。画面外に置いてユーザーには見せない。
        表示中のカレンダーをスクリーンショットすると回答内容が写り込む可能性があるため、
        共有用に別レイアウトを用意している。
      */}
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={cardRef} collapsable={false}>
          <ShareableCalendarCard year={year} month={month} entries={entries} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  content: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navArrow: { fontSize: 28, color: NEUTRAL_COLORS.textPrimary, paddingHorizontal: 12 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  freeRangeNote: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  legendLabel: { fontSize: 11, color: NEUTRAL_COLORS.textSecondary },
  legendBar: { flexDirection: 'row', flex: 1, gap: 2 },
  legendChip: { flex: 1, height: 8, borderRadius: 4 },
  shareButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: NEUTRAL_COLORS.accent,
    alignItems: 'center',
  },
  shareButtonDisabled: { opacity: 0.5 },
  shareButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  shareNote: {
    fontSize: 11,
    color: NEUTRAL_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: -6,
  },
  // キャプチャ用カードを画面外へ逃がす（レンダリングはされるが見えない）
  offscreen: { position: 'absolute', left: -9999, top: 0 },
});
