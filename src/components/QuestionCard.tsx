import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { AnswerScale } from './AnswerScale';
import { FeedbackButtons } from './FeedbackButtons';
import { MascotSpeech } from './MascotSpeech';
import type { AnswerFeedback, QuestionWithAnswer } from '@/types/models';

interface Props {
  question: QuestionWithAnswer;
  index: number;
  total: number;
  editable: boolean;
  /**
   * いま答えてほしい問い（最初の未回答）ならtrue。この1枚だけキャラが吹き出しで尋ねる。
   * 5枚すべてにキャラを出すと画面が賑やかになりすぎ、どれに答えればよいかも曖昧になるため、
   * 「キャラは今の問いの隣にいる」形にしている。
   */
  asking?: boolean;
  onAnswerValue: (value: number) => void;
  onAnswerMemo: (memo: string) => void;
  onFeedback: (feedback: AnswerFeedback) => void;
}

/** 8.1: 質問カード（回答UI＋任意メモ＋フィードバック） */
export function QuestionCard({
  question,
  index,
  total,
  editable,
  asking = false,
  onAnswerValue,
  onAnswerMemo,
  onFeedback,
}: Props) {
  const [memoDraft, setMemoDraft] = useState(question.answer?.memo ?? '');

  const counter = (
    <Text style={styles.counter}>
      {index + 1} / {total}
    </Text>
  );
  const questionText = <Text style={styles.questionText}>{question.text}</Text>;

  return (
    <View style={styles.card}>
      {asking ? (
        // 表情は'think'固定。回答値によって表情や色を変えると、それ自体が
        // 回答UIの色ヒントになり設計判断3-3に反する（Mascot.tsxの冒頭コメント参照）
        <MascotSpeech expression="think">
          {counter}
          {questionText}
        </MascotSpeech>
      ) : (
        <>
          {counter}
          {questionText}
        </>
      )}

      <AnswerScale value={question.answer?.value ?? null} onChange={onAnswerValue} />

      <TextInput
        style={styles.memoInput}
        placeholder="一言メモ（任意）"
        placeholderTextColor={NEUTRAL_COLORS.textSecondary}
        value={memoDraft}
        editable={editable}
        multiline
        onChangeText={setMemoDraft}
        onBlur={() => onAnswerMemo(memoDraft)}
      />

      <View style={styles.footer}>
        <Text style={styles.feedbackLabel}>この質問はどうでしたか？</Text>
        <FeedbackButtons feedback={question.answer?.feedback ?? null} onChange={onFeedback} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    gap: 14,
  },
  counter: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: NEUTRAL_COLORS.textPrimary,
    lineHeight: 26,
  },
  memoInput: {
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    fontSize: 14,
    color: NEUTRAL_COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackLabel: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
});
