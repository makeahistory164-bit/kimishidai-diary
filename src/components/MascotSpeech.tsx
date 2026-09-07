import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Mascot, type MascotExpression } from './Mascot';
import { NEUTRAL_COLORS } from '@/constants/colors';

/**
 * キャラが吹き出しで話す並び。「今日の質問をキャラが聞いてくれる」体験の共通部品。
 *
 * 吹き出しのしっぽは三角ではなく小さな四角にしている（ドット絵の見た目に合わせるため）。
 */
interface Props {
  expression: MascotExpression;
  /** 吹き出しの中身 */
  children: React.ReactNode;
  /** キャラを置く面の背景色。目・口の抜き色に使う */
  surfaceColor?: string;
  /** 吹き出しの背景色。surfaceColorと同じにするとしっぽが消えるので既定では変えている */
  bubbleColor?: string;
  size?: number;
}

export function MascotSpeech({
  expression,
  children,
  surfaceColor = NEUTRAL_COLORS.surface,
  bubbleColor = NEUTRAL_COLORS.background,
  size = 56,
}: Props) {
  return (
    <View style={styles.row}>
      <Mascot expression={expression} size={size} cutColor={surfaceColor} />
      <View style={[styles.bubble, { backgroundColor: bubbleColor }]}>
        <View style={[styles.tail, { backgroundColor: bubbleColor }]} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bubble: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: 18,
    width: 8,
    height: 12,
  },
});
