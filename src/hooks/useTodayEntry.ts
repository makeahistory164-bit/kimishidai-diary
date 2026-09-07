import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadTodayEntryDetail,
  startTodayQuestions,
  submitAnswer,
  submitFeedback,
} from '@/services/dailyEntryService';
import type { AnswerFeedback, DailyEntryDetail } from '@/types/models';

/** 8.1 ホーム画面のロジックをまとめたフック */
export function useTodayEntry() {
  const [entry, setEntry] = useState<DailyEntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionStartedAt = useRef<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await loadTodayEntryDetail();
      setEntry(detail);
      for (const q of detail.questions) {
        if (!questionStartedAt.current.has(q.id)) {
          questionStartedAt.current.set(q.id, Date.now());
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const start = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const detail = await startTodayQuestions();
      setEntry(detail);
      for (const q of detail.questions) {
        questionStartedAt.current.set(q.id, Date.now());
      }
    } catch (e) {
      setError('質問の生成に失敗しました。もう一度お試しください。');
      console.warn(e);
    } finally {
      setGenerating(false);
    }
  }, []);

  const answerValue = useCallback(
    async (questionId: string, value: number) => {
      if (!entry) return;
      const startedAt = questionStartedAt.current.get(questionId);
      const responseTimeSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;
      const updated = await submitAnswer({
        dailyEntryId: entry.id,
        questionId,
        value,
        responseTimeSeconds,
      });
      setEntry(updated);
    },
    [entry]
  );

  const answerMemo = useCallback(
    async (questionId: string, memo: string) => {
      if (!entry) return;
      const question = entry.questions.find((q) => q.id === questionId);
      // 回答値（4段階評価）が未選択のうちはAnswerレコード自体が作れないため、
      // メモ単独では保存しない（value必須のスキーマ設計・9.2）
      if (!question?.answer) return;
      const updated = await submitAnswer({
        dailyEntryId: entry.id,
        questionId,
        value: question.answer.value,
        memo,
      });
      setEntry(updated);
    },
    [entry]
  );

  const feedback = useCallback(
    async (questionId: string, value: AnswerFeedback) => {
      if (!entry) return;
      const updated = await submitFeedback(entry.id, questionId, value);
      setEntry(updated);
    },
    [entry]
  );

  return { entry, loading, generating, error, start, answerValue, answerMemo, feedback, reload: load };
}
