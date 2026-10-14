import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXIS_GRADIENT_COLORS, NEUTRAL_COLORS } from '@/constants/colors';

// 載せるのは実装済みの機能だけ。要件書12.3にある「年次レポート」
// 「データエクスポート」は未実装のため外してある。未実装の機能を売ると
// Guideline 2.1 / 3.1 違反になり、買い切りでは「買ったのに使えない」苦情に直結する。
const ROWS: Array<{ label: string; free: string; premium: string }> = [
  { label: '毎日の質問・回答', free: '○', premium: '○' },
  { label: '今日やること・「誰のため」の記録', free: '○', premium: '○' },
  { label: 'カレンダー閲覧', free: '直近3ヶ月', premium: '全期間' },
  { label: '月次レポート', free: '—', premium: '○' },
];

/** 8.6: 「無料 / プレミアム」比較表（12.3の機能差） */
export function PaywallCompareTable() {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.labelCell, styles.headerText]}>機能</Text>
        <Text style={[styles.cell, styles.headerText]}>無料</Text>
        <Text style={[styles.cell, styles.headerText]}>プラス</Text>
      </View>
      {ROWS.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.cell, styles.labelCell]}>{row.label}</Text>
          <Text style={styles.cell}>{row.free}</Text>
          <Text style={[styles.cell, styles.premiumText]}>{row.premium}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_COLORS.border,
  },
  headerRow: { borderTopWidth: 0, backgroundColor: NEUTRAL_COLORS.background },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: NEUTRAL_COLORS.textPrimary,
    textAlign: 'center',
  },
  labelCell: { flex: 2, textAlign: 'left' },
  headerText: { fontWeight: '700', fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  // AXIS_GRADIENT_COLORSの最も濃い緑。以前は同じ値が手打ちで重複していた
  premiumText: { fontWeight: '700', color: AXIS_GRADIENT_COLORS[AXIS_GRADIENT_COLORS.length - 1] },
});
