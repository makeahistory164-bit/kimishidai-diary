import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';

/**
 * 8.5: リマインダー時刻の選択UI。
 *
 * @react-native-community/datetimepicker のようなネイティブ依存を足さず、
 * 既存のScreenTimeInputと同様に自前で組んでいる。Expo Goでそのまま動かせること、
 * および依存を増やさないこと（第0段階の方針）を優先した。
 *
 * 分は5分刻み。リマインダー時刻に1分単位の精度は不要な一方、
 * 60個の選択肢を並べると探す手間が増えるため。
 */
interface Props {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/** チップ幅(44) + gap(8)。選択中チップの位置計算に使う */
const CHIP_PITCH = 52;

/**
 * 選択中のチップを表示位置まで送る。
 * これがないと、例えば21:00設定時に「時」の行には00〜05しか見えず、
 * 選択中の21が画面外に隠れて「何時に設定されているか分からない」状態になる。
 */
function useScrollToSelected(selectedIndex: number) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    // 左に1つ分の余白を残すと、前後の並びが見えて現在位置を把握しやすい
    const x = Math.max(0, (selectedIndex - 1) * CHIP_PITCH);
    // レイアウト確定後でないとスクロールが効かないため次フレームで実行する
    const timer = setTimeout(() => ref.current?.scrollTo({ x, animated: false }), 0);
    return () => clearTimeout(timer);
    // マウント時のみ。操作のたびに動かすとユーザーのスクロールと競合するため依存は空にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

export function ReminderTimePicker({ hour, minute, onChange }: Props) {
  const hourRef = useScrollToSelected(hour);
  const minuteRef = useScrollToSelected(MINUTES.indexOf(minute));

  return (
    <View style={styles.container}>
      <Text style={styles.preview}>
        {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
      </Text>

      <Text style={styles.label}>時</Text>
      <ScrollView
        ref={hourRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {HOURS.map((h) => (
          <Chip key={h} active={h === hour} onPress={() => onChange(h, minute)}>
            {String(h).padStart(2, '0')}
          </Chip>
        ))}
      </ScrollView>

      <Text style={styles.label}>分</Text>
      <ScrollView
        ref={minuteRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {MINUTES.map((m) => (
          <Chip key={m} active={m === minute} onPress={() => onChange(hour, m)}>
            {String(m).padStart(2, '0')}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  children,
  active,
  onPress,
}: {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: 4 },
  preview: {
    fontSize: 32,
    fontWeight: '700',
    color: NEUTRAL_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, marginTop: 4 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: NEUTRAL_COLORS.accent, borderColor: NEUTRAL_COLORS.accent },
  chipText: { fontSize: 14, color: NEUTRAL_COLORS.textPrimary },
  chipTextActive: { color: NEUTRAL_COLORS.onAccent, fontWeight: '700' },
});
