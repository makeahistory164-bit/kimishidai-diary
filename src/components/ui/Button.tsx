import React from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, RADIUS, MIN_TAP, SPACING } from '@/constants/theme';

/**
 * アプリ共通のボタン。
 *
 * 以前はプライマリボタンが7箇所で別々に定義され、paddingVertical が
 * 12/14/16、borderRadius が10/12/14とばらついていた。寸法の決定はここだけ。
 * HIGの最小タップ寸法44ptを minHeight で保証する。
 */
export type ButtonVariant = 'primary' | 'secondary';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TAP,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: NEUTRAL_COLORS.accent },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  label: { ...TYPE.headline, textAlign: 'center' },
  primaryLabel: { color: NEUTRAL_COLORS.onAccent },
  secondaryLabel: { color: NEUTRAL_COLORS.textPrimary },
});

/**
 * 文字だけのボタン（インラインのリンク風）。
 * 見た目は文字だけだが、HIGの最小タップ寸法を満たすため縦幅を確保する。
 * 以前はこの用途が padding も hitSlop も無い素の Pressable で、高さが約16ptしかなかった。
 */
export function TextButton({
  label,
  onPress,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [textButtonStyles.wrapper, pressed && { opacity: 0.6 }]}
    >
      <Text style={textButtonStyles.label}>{label}</Text>
    </Pressable>
  );
}

const textButtonStyles = StyleSheet.create({
  wrapper: {
    minHeight: MIN_TAP,
    justifyContent: 'center',
  },
  label: { ...TYPE.subhead, fontWeight: '600', color: NEUTRAL_COLORS.textPrimary },
});
