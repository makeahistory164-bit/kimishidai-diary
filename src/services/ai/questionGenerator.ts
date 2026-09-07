import type { QuestionPolarity, QuestionSource } from '@/types/models';
import type { DailySummaryInput } from '@/services/localAnalysis/summaryBuilder';
import { getFallbackQuestionSet } from '@/constants/fallbackQuestions';
import { listRecentQuestionTexts } from '@/db/repositories/questionRepo';
import { callClaudeForStructuredOutput, ClaudeApiError } from './claudeClient';

/**
 * 6.1: AI質問生成機能。
 * 生の回答ログ・生メモは渡さず、10章のローカル集計サマリーのみをプロンプト材料にする。
 */
export interface GeneratedQuestion {
  text: string;
  category: string;
  polarity: QuestionPolarity;
}

export interface GenerateQuestionsResult {
  questions: GeneratedQuestion[];
  source: QuestionSource;
}

const SYSTEM_PROMPT = `あなたは「キミシダイ日記」という内省アプリの質問設計者です。
このアプリのコンセプトは「今日一日を自分軸で生きられたか」を振り返ることです。
「自分軸」とは、他人の評価や期待ではなく、自分の価値観・意思を基準に選択・行動できている状態を指します。

# 質問設計のルール
- 3〜5問の質問セットを生成すること
- 各質問は「今日、誰かの顔色をうかがって決めたことはあった？」のように、Yes/Noや程度で
  答えやすく、かつ内省を促すものにすること
- 各質問には category（仕事・人間関係・お金・健康・家族・将来やキャリア 等、日本語の短い単語）と
  polarity を付与すること
  - polarity="positive": 「はい」寄りの回答が自分軸度が高いことを意味する質問
  - polarity="negative": 「はい」寄りの回答が自分軸度が低い（他人軸に流された）ことを意味する質問
- 文言のトーンは断定・説教調を避け、責めない・寄り添う語り口にすること
- ユーザーの直近の傾向（サマリーJSON）を参考に、マンネリを防ぎつつ、その人に合った切り口にすること
- avoided_categories に含まれるカテゴリの質問は生成しないか、頻度を大きく下げること
- preferred_categories に含まれるカテゴリは積極的に取り入れてよいこと
- スクリーンタイム（screen_time_vs_avg）が大きく増えている場合、それを「使いすぎ=悪」と断定せず、
  本人に問い直させるような質問にしてよい（正当な利用の可能性もあるため機械的に責めない）
- todos は、ユーザーがその日やると決めたことと、やり終えたものを「誰のためにやったか」
  （self=自分のため / family=家族・大切な人 / work=仕事・職場 / other=その他の人）に分けた記録である。
  ここから質問を作るときの注意点:
  - 「未完了が多い＝自分軸で生きられていない」と決めつけないこと。要らないと判断してやめた、
    家族を優先した、といった未完了はむしろ自分軸でありうる
  - 「他人のため」が多いこと自体も悪ではない。ただし本人が納得して選んだのか、断れなかったのかは
    本人にしか分からないので、そこを問う質問は有効
  - done_for が work や other に偏っている日は、「やり切ったこと」と「やりたかったこと」の
    ずれを問う良い機会になる`;

const QUESTIONS_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '質問文（日本語、1文）' },
          category: { type: 'string', description: '質問のカテゴリ（短い日本語）' },
          polarity: { type: 'string', enum: ['positive', 'negative'] },
        },
        required: ['text', 'category', 'polarity'],
      },
    },
  },
  required: ['questions'],
};

function isValidQuestion(q: unknown): q is GeneratedQuestion {
  if (!q || typeof q !== 'object') return false;
  const candidate = q as Record<string, unknown>;
  return (
    typeof candidate.text === 'string' &&
    candidate.text.trim().length > 0 &&
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0 &&
    (candidate.polarity === 'positive' || candidate.polarity === 'negative')
  );
}

function buildUserMessage(summary: DailySummaryInput): string {
  const payload = {
    period: summary.period,
    avg_score: summary.avgScore,
    answered_days: summary.answeredDays,
    categories: Object.fromEntries(
      Object.entries(summary.categories).map(([k, v]) => [
        k,
        { avg_score: v.avgScore, trend: v.trend },
      ])
    ),
    recent_keywords: summary.recentKeywords,
    screen_time_vs_avg: summary.screenTimeVsAvg ?? 'データなし',
    last_answered_days_ago: summary.lastAnsweredDaysAgo,
    day_of_week: summary.dayOfWeek,
    time_of_day: summary.timeOfDay,
    interest_themes: summary.interestThemes,
    preferred_categories: summary.preferredCategories,
    avoided_categories: summary.avoidedCategories,
    todos: {
      total: summary.todos.totalCount,
      completed: summary.todos.completedCount,
      unfinished: summary.todos.unfinishedCount,
      done_for: summary.todos.doneForBreakdown,
    },
  };
  return `以下は直近のユーザー傾向のサマリーです。これを参考に今日の質問セットを生成してください。\n\n${JSON.stringify(
    payload,
    null,
    2
  )}`;
}

/**
 * 6.1: AI質問生成のオーケストレーション。
 * 失敗（ネットワークエラー・タイムアウト・不正な出力形式）時は、
 * あらかじめ用意した固定質問セットに自動フォールバックする。
 */
export async function generateQuestions(
  summary: DailySummaryInput
): Promise<GenerateQuestionsResult> {
  // 直近3週間に出した質問は候補から外す（プールが112問あるため、
  // 3週間分＝最大105問を除外しても選出できる。足りなくなった場合は
  // getFallbackQuestionSet側が出題済みからも補充する）。
  const recentTexts = await listRecentQuestionTexts(21).catch(() => [] as string[]);

  // 関心テーマはAIプロンプトだけでなくフォールバック選出にも渡す。
  // 第0段階（AI未導入）ではフォールバックしか通らないため、渡さないと
  // 設定画面で関心テーマを選んでも出題が一切変わらない状態になる。
  const interestThemes = summary.interestThemes;

  // APIキー未設定時はネットワーク往復すら不要なので、即フォールバックする。
  // 第0段階（AI未導入）ではこれが通常の経路になる。
  if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
    return {
      questions: getFallbackQuestionSet(5, recentTexts, interestThemes),
      source: 'fallback',
    };
  }

  try {
    const result = await callClaudeForStructuredOutput<{ questions: unknown[] }>({
      system: SYSTEM_PROMPT,
      userMessage: buildUserMessage(summary),
      toolName: 'submit_questions',
      toolDescription: '今日の内省質問セット（3〜5問）を提出する',
      toolInputSchema: QUESTIONS_TOOL_SCHEMA,
      maxTokens: 1024,
      timeoutMs: 8000,
    });

    const questions = (result.questions ?? []).filter(isValidQuestion);
    if (questions.length < 3) {
      throw new ClaudeApiError('AI生成結果の質問数が不足しています');
    }
    return { questions: questions.slice(0, 5), source: 'ai_generated' };
  } catch (error) {
    console.warn('[questionGenerator] AI質問生成に失敗。フォールバック質問を使用します。', error);
    return {
      questions: getFallbackQuestionSet(5, recentTexts, interestThemes),
      source: 'fallback',
    };
  }
}
