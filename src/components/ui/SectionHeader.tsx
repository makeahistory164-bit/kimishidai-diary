import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, SPACING } from '@/constants/theme';

/**
 * カードやリストの上に置く小見出し。
 * 以前は4箇所で4種類のスタイルが別名定義されていた。
 */
export function SectionHeader({ title }: { title: string }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    ...TYPE.footnote,
    fontWeight: '600',
    color: NEUTRAL_COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});
