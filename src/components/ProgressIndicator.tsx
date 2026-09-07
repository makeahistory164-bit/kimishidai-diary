import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';

interface Props {
  answered: number;
  total: number;
}

/** 8.1: 進捗表示（例: 「3/5問 回答済み」） */
export function ProgressIndicator({ answered, total }: Props) {
  const ratio = total > 0 ? answered / total : 0;
  return (
    <View>
      <Text style={styles.text}>
        {answered}/{total}問 回答済み
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, color: NEUTRAL_COLORS.textSecondary, marginBottom: 6 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: NEUTRAL_COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: NEUTRAL_COLORS.accent,
  },
});
