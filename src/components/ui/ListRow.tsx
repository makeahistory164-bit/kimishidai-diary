import React from 'react';
import { View, Text, Pressable, Switch, Platform, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, MIN_TAP, SPACING } from '@/constants/theme';

/**
 * 設定画面などのリスト1行。
 *
 * 【なぜ Switch を使うか】以前はオン/オフを「オンにする」「オフにする」という
 * 右端のテキストで表していた。これは状態ではなく操作を指す文言なので、
 * VoiceOverでは現在の状態と逆に聞こえていた（オンのとき「オフにする」と読まれる）。
 * ネイティブの Switch なら状態と role が標準で正しく伝わる。
 *
 * 高さは HIG の最小タップ寸法 44pt を minHeight で保証する。
 */
type Common = { label: string; sublabel?: string };

type Props =
  | (Common & { kind: 'switch'; value: boolean; onValueChange: (value: boolean) => void })
  | (Common & { kind: 'navigation'; onPress: () => void });

export function ListRow(props: Props) {
  const content = (
    <View style={styles.labels}>
      <Text style={styles.label}>{props.label}</Text>
      {props.sublabel ? <Text style={styles.sublabel}>{props.sublabel}</Text> : null}
    </View>
  );

  if (props.kind === 'switch') {
    return (
      <View style={styles.row}>
        {content}
        <Switch
          value={props.value}
          onValueChange={props.onValueChange}
          // ラベルは隣の Text が読まれるので、Switch 自身には持たせない
          accessibilityLabel={props.label}
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
      <Chevron />
    </Pressable>
  );
}

/** iOS標準の遷移インジケータ。以前は「開く」というテキストで代用していた。 */
function Chevron() {
  if (Platform.OS !== 'ios') {
    return <Text style={styles.chevronFallback}>›</Text>;
  }
  return (
    <SymbolView
      name="chevron.right"
      size={14}
      tintColor={NEUTRAL_COLORS.textSecondary}
      resizeMode="scaleAspectFit"
    />
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TAP,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pressed: { opacity: 0.6 },
  labels: { flex: 1, gap: 2 },
  label: { ...TYPE.body, color: NEUTRAL_COLORS.textPrimary },
  sublabel: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
  chevronFallback: { ...TYPE.body, color: NEUTRAL_COLORS.textSecondary },
});
