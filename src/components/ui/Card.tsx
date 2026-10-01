import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

/** 角丸カード。以前は7箇所で角丸12/14/16がばらついていたので RADIUS.card に統一する。 */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
});
