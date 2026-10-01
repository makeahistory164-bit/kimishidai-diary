import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, SPACING, RADIUS, MIN_TAP } from '@/constants/theme';

/** 回答値1〜4に対応するラベル。日別詳細でも同じ並びを使うのでここから import すること。 */
export const SCALE_LABELS = ['そう思わない', 'あまり思わない', 'やや思う', 'そう思う'];

interface Props {
  value: number | null; // 1-4
  onChange: (value: number) => void;
}

/**
 * 8.1: 4段階評価の回答UI。
 * 「回答中は色のヒントを一切出さないニュートラルなデザイン」（8.1の設計方針）とし、
 * スコアの高低を示唆する色は一切使わない。
 */
export function AnswerScale({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {SCALE_LABELS.map((label, index) => {
        const optionValue = index + 1;
        const selected = value === optionValue;
        return (
          <Pressable
            key={optionValue}
            onPress={() => onChange(optionValue)}
            style={[styles.option, selected && styles.optionSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  option: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: MIN_TAP,
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    backgroundColor: NEUTRAL_COLORS.surface,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: NEUTRAL_COLORS.accent,
    borderColor: NEUTRAL_COLORS.accent,
  },
  optionText: {
    ...TYPE.subhead,
    color: NEUTRAL_COLORS.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: NEUTRAL_COLORS.onAccent,
    fontWeight: '600',
  },
});
