import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TODO_DONE_FOR_OPTIONS, type TodoDoneFor } from '@/types/models';

interface Props {
  visible: boolean;
  /** 対象のTODO本文（何について聞かれているか分かるように表示する） */
  todoText: string;
  /** 変更モードのとき、現在の選択値 */
  current?: TodoDoneFor | null;
  onSelect: (doneFor: TodoDoneFor) => void;
  onCancel: () => void;
}

/**
 * TODO完了時に「誰のためにやったか」を選ばせるシート。
 *
 * この問い自体が内省の仕掛けなので、スキップはさせない（キャンセルすると完了もされない）。
 * ただし選択肢に良し悪しの色付けはしない ——「他人のため」が悪いわけではないため
 * （要件書8.4の責めない語り口 / 10.6の機械的判定を避ける方針に沿う）。
 */
export function DoneForSheet({ visible, todoText, current, onSelect, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>これは誰のためにやったこと？</Text>
          <Text style={styles.todoText} numberOfLines={2}>
            {todoText}
          </Text>

          <View style={styles.options}>
            {TODO_DONE_FOR_OPTIONS.map((option) => {
              const selected = current === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onSelect(option.value)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.note}>
            どれを選んでも点数は変わりません。あとから見返すための記録です。
          </Text>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  todoText: {
    fontSize: 14,
    color: NEUTRAL_COLORS.textSecondary,
    backgroundColor: NEUTRAL_COLORS.background,
    padding: 12,
    borderRadius: 10,
  },
  options: { gap: 8, marginTop: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  optionSelected: {
    backgroundColor: NEUTRAL_COLORS.accent,
    borderColor: NEUTRAL_COLORS.accent,
  },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 15, color: NEUTRAL_COLORS.textPrimary, fontWeight: '500' },
  optionLabelSelected: { color: '#FFFFFF', fontWeight: '600' },
  note: {
    fontSize: 12,
    color: NEUTRAL_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, color: NEUTRAL_COLORS.textSecondary },
});
