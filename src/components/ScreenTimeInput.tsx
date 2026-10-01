import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';

interface Props {
  initialMinutes?: number | null;
  onSubmit: (minutes: number) => void;
}

/**
 * 10.6/付録B: スクリーンタイムの自己申告入力UI。
 * OS APIからの自動取得ではなく、ユーザー自身が「今日のスマホ利用時間（分）」を
 * 入力する簡易フォーム（iOS標準の「スクリーンタイム」等で確認した値を入力する想定）。
 */
export function ScreenTimeInput({ initialMinutes, onSubmit }: Props) {
  const [text, setText] = useState(initialMinutes != null ? String(initialMinutes) : '');

  const handleSubmit = () => {
    const minutes = parseInt(text, 10);
    if (!Number.isNaN(minutes) && minutes >= 0) {
      onSubmit(minutes);
    }
  };

  return (
    <View>
      <Text style={styles.helper}>
        今日のスマホ利用時間（分）を入力してください。OS標準の「スクリーンタイム」アプリ等で確認できます。
      </Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="例: 180"
          placeholderTextColor={NEUTRAL_COLORS.textSecondary}
          value={text}
          onChangeText={setText}
        />
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>保存</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, marginBottom: 8, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: NEUTRAL_COLORS.textPrimary,
  },
  button: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: NEUTRAL_COLORS.accent,
  },
  buttonText: { color: NEUTRAL_COLORS.onAccent, fontWeight: '600' },
});
