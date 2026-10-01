import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { MIN_TAP, SPACING } from '@/constants/theme';
import type { AnswerFeedback } from '@/types/models';

interface Props {
  feedback: AnswerFeedback;
  onChange: (feedback: AnswerFeedback) => void;
}

/** 10.5: 質問ごとの👍（刺さった）/👎（響かなかった）の軽量フィードバック */
export function FeedbackButtons({ feedback, onChange }: Props) {
  const toggle = (target: 'up' | 'down') => {
    onChange(feedback === target ? null : target);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => toggle('up')}
        style={[styles.button, feedback === 'up' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: feedback === 'up' }}
        accessibilityLabel="この質問は刺さった"
      >
        <Text style={styles.icon}>👍</Text>
      </Pressable>
      <Pressable
        onPress={() => toggle('down')}
        style={[styles.button, feedback === 'down' && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: feedback === 'down' }}
        accessibilityLabel="この質問は響かなかった"
      >
        <Text style={styles.icon}>👎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.sm },
  button: {
    // 以前は36x36でHIGの最小タップ寸法を下回っていた
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEUTRAL_COLORS.background,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  buttonActive: {
    backgroundColor: NEUTRAL_COLORS.border,
    borderColor: NEUTRAL_COLORS.textSecondary,
  },
  icon: { fontSize: 17 },
});
