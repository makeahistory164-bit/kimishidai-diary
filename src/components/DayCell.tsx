import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getCalendarStageColor, UNANSWERED_TEXT_COLOR, NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, MIN_TAP } from '@/constants/theme';

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
  const textColor = hasEntry ? NEUTRAL_COLORS.onAccent : UNANSWERED_TEXT_COLOR;

  return (
    <Pressable
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
      // スコアを背景色だけで表しているので、読み上げでも分かるようにする
      accessibilityLabel={
        hasEntry ? `${day}日 軸スコア ${axisScore}` : `${day}日 記録なし`
      }
      accessibilityState={{ selected: isToday }}
    >
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

/** HIGの最小タップ寸法に合わせる（当たり判定はマス全体だが、見た目も44ptにする） */
const CELL_SIZE = MIN_TAP;

const styles = StyleSheet.create({
  wrapper: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    ...TYPE.subhead,
    width: CELL_SIZE,
    height: CELL_SIZE,
    // 丸の中で数字を縦中央に置くため、TYPEのlineHeightはここで上書きする
    lineHeight: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    textAlign: 'center',
    overflow: 'hidden',
  },
  todayOutline: {
    borderWidth: 1.5,
    borderColor: NEUTRAL_COLORS.textSecondary,
  },
});
