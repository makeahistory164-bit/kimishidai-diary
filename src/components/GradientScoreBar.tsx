import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AXIS_GRADIENT_COLORS, NEUTRAL_COLORS } from '@/constants/colors';

interface Props {
  /** 0〜100の軸スコア。nullなら「未回答」表示 */
  score: number | null;
  /** 8.6ペイウォール: 無料範囲でバーを途中で途切れさせる表現に使う（0〜100、省略時は途切れなし） */
  truncateAtPercent?: number;
  height?: number;
  showLabel?: boolean;
}

/**
 * 11.4補足: 8.1（完了後スコア表示）・8.3（日別詳細）・8.6（ペイウォール）で共通利用する
 * 暖色→グレー→緑のグラデーションバー＋マーカー。
 */
export function GradientScoreBar({ score, truncateAtPercent, height = 16, showLabel = true }: Props) {
  const visiblePercent = truncateAtPercent ?? 100;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View style={{ width: `${visiblePercent}%`, height: '100%', overflow: 'hidden' }}>
          <LinearGradient
            colors={AXIS_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {truncateAtPercent !== undefined && (
          <View style={[styles.truncatedOverlay, { left: `${visiblePercent}%` }]} />
        )}
        {score !== null && truncateAtPercent === undefined && (
          <View
            style={[
              styles.marker,
              { left: `${Math.max(2, Math.min(98, score))}%`, height: height + 8, top: -4 },
            ]}
          />
        )}
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {score === null ? 'まだ回答がありません' : `軸スコア ${score}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: NEUTRAL_COLORS.border,
    overflow: 'visible',
    flexDirection: 'row',
  },
  marker: {
    position: 'absolute',
    width: 3,
    borderRadius: 2,
    backgroundColor: NEUTRAL_COLORS.textPrimary,
  },
  truncatedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: NEUTRAL_COLORS.background,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.textSecondary,
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    color: NEUTRAL_COLORS.textSecondary,
  },
});
