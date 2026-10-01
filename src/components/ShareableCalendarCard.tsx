import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  AXIS_GRADIENT_COLORS,
  getCalendarStageColor,
  NEUTRAL_COLORS,
  UNANSWERED_TEXT_COLOR,
} from '@/constants/colors';
import type { DailyEntry } from '@/types/models';

interface Props {
  year: number;
  month: number; // 1-12
  entries: DailyEntry[];
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * SNS共有用のカード。画面表示用のCalendarGridとは別物として作っている。
 *
 * 【設計方針】
 * - **回答内容・メモ・質問文は一切含めない。** 色のパターンと記録日数だけ。
 *   内面の記録を扱うアプリなので、「続けている事実」だけを見せられるようにする。
 * - 平均スコアは載せない。数字が低い月を晒すことになり、共有をためらわせるため。
 *   要件書8.4の責めない方針とも一貫させる。
 * - アプリ名とサブタイトルを入れる（共有された画像から何のアプリか分かるように）。
 * - 画面のスクリーンショットではなく、単体の画像として成立するレイアウトにする。
 */
export function ShareableCalendarCard({ year, month, entries }: Props) {
  const entryByDate = new Map(entries.map((e) => [e.date, e]));
  const recordedDays = entries.filter((e) => e.axisScore !== null).length;

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: Array<{ day: number; axisScore: number | null } | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, axisScore: entryByDate.get(dateKey)?.axisScore ?? null });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.month}>
          {year}年 {month}月
        </Text>
        <Text style={styles.recorded}>{recordedDays}日 記録</Text>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          if (!cell) return <View key={`blank-${idx}`} style={styles.cellWrapper} />;
          const hasEntry = cell.axisScore !== null;
          return (
            <View key={cell.day} style={styles.cellWrapper}>
              <Text
                style={[
                  styles.cell,
                  {
                    backgroundColor: hasEntry ? getCalendarStageColor(cell.axisScore!) : 'transparent',
                    color: hasEntry ? NEUTRAL_COLORS.onAccent : UNANSWERED_TEXT_COLOR,
                  },
                ]}
              >
                {cell.day}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>軸がブレた日</Text>
        <View style={styles.legendBar}>
          {AXIS_GRADIENT_COLORS.map((c) => (
            <View key={c} style={[styles.legendChip, { backgroundColor: c }]} />
          ))}
        </View>
        <Text style={styles.legendLabel}>自分軸を保てた日</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.appName}>キミシダイ日記</Text>
        <Text style={styles.tagline}>取り戻せ、あなた色の人生</Text>
      </View>
    </View>
  );
}

const CELL = 36;

const styles = StyleSheet.create({
  card: {
    width: 340,
    backgroundColor: NEUTRAL_COLORS.surface,
    padding: 24,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  month: { fontSize: 20, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  recorded: { fontSize: 14, color: NEUTRAL_COLORS.textSecondary, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    color: NEUTRAL_COLORS.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrapper: {
    width: '14.28%',
    height: CELL + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: CELL,
    height: CELL,
    lineHeight: CELL,
    borderRadius: CELL / 2,
    textAlign: 'center',
    fontSize: 13,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  legendLabel: { fontSize: 11, color: NEUTRAL_COLORS.textSecondary },
  legendBar: { flexDirection: 'row', flex: 1, gap: 2 },
  legendChip: { flex: 1, height: 6, borderRadius: 3 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_COLORS.border,
    paddingTop: 12,
    marginTop: 2,
    alignItems: 'center',
    gap: 2,
  },
  appName: { fontSize: 14, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  tagline: { fontSize: 11, color: NEUTRAL_COLORS.textSecondary },
});
