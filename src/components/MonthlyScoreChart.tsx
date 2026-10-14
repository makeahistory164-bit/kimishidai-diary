import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXIS_GRADIENT_COLORS, NEUTRAL_COLORS, getCalendarStageColor } from '@/constants/colors';
import { TYPE, SPACING } from '@/constants/theme';
import type { DailyScorePoint } from '@/services/report/monthlyReport';

const CHART_HEIGHT = 120;
/** スコア0の日も「記録した日」として見えるよう、棒に最低限の高さを持たせる */
const MIN_BAR_HEIGHT = 6;

/**
 * 月次レポートの「毎日の軸の推移」。1日1本の棒で、高さと色の両方でスコアを表す。
 * 色はカレンダーと同じ5段階配色にして、カレンダーで見た印象と食い違わないようにする。
 * 数値の目盛りは出さない（monthlyReport.ts の「見せ方の方針」参照）。
 */
export function MonthlyScoreChart({ points }: { points: DailyScorePoint[] }) {
  const lastDay = points.length;
  const recorded = points.filter((p) => p.axisScore !== null).length;

  return (
    <View
      accessible
      accessibilityLabel={`${lastDay}日中${recorded}日の記録を、日ごとの棒グラフで表示しています`}
    >
      <View style={styles.chart}>
        {points.map((p) => (
          <View key={p.day} style={styles.column}>
            {p.axisScore === null ? (
              <View style={styles.emptyMark} />
            ) : (
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(MIN_BAR_HEIGHT, (p.axisScore / 100) * CHART_HEIGHT),
                    backgroundColor: getCalendarStageColor(p.axisScore),
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.axis}>
        {[1, 10, 20, lastDay].map((day) => (
          <Text key={day} style={styles.axisLabel}>
            {day}日
          </Text>
        ))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_COLORS.border,
  },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  // 記録のない日は塗らず、基線上の小さな点で「その日がある」ことだけ示す
  emptyMark: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: NEUTRAL_COLORS.border,
    marginBottom: 2,
  },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  axisLabel: { ...TYPE.caption, color: NEUTRAL_COLORS.textSecondary },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
  legendLabel: { ...TYPE.caption, color: NEUTRAL_COLORS.textSecondary },
  legendBar: { flexDirection: 'row', flex: 1, gap: 2 },
  legendChip: { flex: 1, height: 8, borderRadius: 4 },
});
