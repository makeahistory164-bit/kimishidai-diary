import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getCalendarStageColor, UNANSWERED_TEXT_COLOR, NEUTRAL_COLORS } from '@/constants/colors';

interface Props {
  day: number;
  axisScore: number | null; // null = 未実施（11.4: レコード有無で判定）
  isToday: boolean;
  onPress: () => void;
}

/** 8.2: カレンダーの1マス。実施日=5段階配色、未実施日=数字のみ薄く（塗りなし） */
export function DayCell({ day, axisScore, isToday, onPress }: Props) {
  const hasEntry = axisScore !== null;
  const backgroundColor = hasEntry ? getCalendarStageColor(axisScore) : 'transparent';
  const textColor = hasEntry ? '#FFFFFF' : UNANSWERED_TEXT_COLOR;

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Text
        style={[
          styles.day,
          { backgroundColor, color: textColor },
          isToday && !hasEntry && styles.todayOutline,
        ]}
      >
        {day}
      </Text>
    </Pressable>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  wrapper: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    textAlign: 'center',
    fontSize: 14,
    overflow: 'hidden',
  },
  todayOutline: {
    borderWidth: 1.5,
    borderColor: NEUTRAL_COLORS.textSecondary,
  },
});
