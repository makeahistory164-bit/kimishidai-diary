/**
 * 要件定義書 9.2 テーブル定義に対応するTypeScript型。
 * https://Downloads/キミシダイ日記_要件定義書.md 参照
 */

/** DailyEntry.status */
export type DailyEntryStatus = 'not_started' | 'in_progress' | 'completed';

/** Question.polarity（11.2: 質問の向き） */
export type QuestionPolarity = 'positive' | 'negative';

/** Question.source（AI生成 or フォールバック） */
export type QuestionSource = 'ai_generated' | 'fallback';

/** Answer.feedback（10.5: 軽量な明示的シグナル） */
export type AnswerFeedback = 'up' | 'down' | null;

/** UserPreference.premium_status */
export type PremiumStatus = 'free' | 'premium_active' | 'premium_trial';

/** ScreenTimeLog.source */
export type ScreenTimeSource = 'ios' | 'android';

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  axisScore: number | null; // 0-100
  status: DailyEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  dailyEntryId: string;
  text: string;
  category: string;
  polarity: QuestionPolarity;
  source: QuestionSource;
  displayOrder: number;
}

export interface Answer {
  id: string;
  questionId: string;
  value: number; // 1-4
  memo: string | null;
  feedback: AnswerFeedback;
  responseTimeSeconds: number | null;
  answeredAt: string;
}

/**
 * UserPreference.notification_settings に格納する毎日のリマインダー設定。
 *
 * 端末内のローカル通知のみで実現するため、プッシュ通知基盤（Expo Push / FCM）も
 * サーバーも不要。第0段階の「コスト0円」方針を崩さない。
 */
export interface ReminderSettings {
  enabled: boolean;
  /** 0〜23 */
  hour: number;
  /** 0〜59 */
  minute: number;
}

/** リマインダー未設定時の既定値。21:00は「一日を振り返れる時間帯」として選定 */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 21,
  minute: 0,
};

export interface UserPreference {
  id: string;
  interestThemes: string[];
  premiumStatus: PremiumStatus;
  premiumExpiresAt: string | null;
  notificationSettings: ReminderSettings | null;
  onboardingCompleted: boolean;
  screenTimeOptIn: boolean;
}

export interface ScreenTimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  source: ScreenTimeSource;
  collectedAt: string;
}

/**
 * Todo.done_for: そのタスクを「誰のためにやったか」。
 *
 * 【設計方針】この値は軸スコアの算出には一切使わない。
 * 要件書10.6がスクリーンタイムについて出した結論と同じ理由による:
 * 「他人のため」が自動的に他人軸を意味するわけではない（家族のために動くことは
 * その人の価値観＝自分軸でありうる）ため、機械的に採点すると誤判定する。
 * この値はあくまで①ユーザー自身が振り返るための記録、②将来のAI質問生成の材料
 * として使う。
 */
export type TodoDoneFor = 'self' | 'family' | 'work' | 'other';

export interface Todo {
  id: string;
  date: string; // YYYY-MM-DD（その日のTODO）
  text: string;
  /** 完了時にユーザーが選択する。未完了のうちはnull */
  doneFor: TodoDoneFor | null;
  completedAt: string | null;
  displayOrder: number;
  createdAt: string;
}

/** TODO完了時に提示する選択肢。責めない・寄り添う語り口（要件書8.4）に合わせ、中立的な文言にする */
export const TODO_DONE_FOR_OPTIONS: Array<{ value: TodoDoneFor; label: string; emoji: string }> = [
  { value: 'self', label: '自分のため', emoji: '🙋' },
  { value: 'family', label: '家族・大切な人のため', emoji: '💛' },
  { value: 'work', label: '仕事・職場のため', emoji: '💼' },
  { value: 'other', label: 'その他の人のため', emoji: '🤝' },
];

/** 6.1: 関心テーマの候補（UserPreference.interest_themes） */
export const INTEREST_THEME_OPTIONS = [
  '仕事',
  '人間関係',
  'お金',
  '健康',
  '家族',
  '恋愛',
  '将来・キャリア',
] as const;
export type InterestTheme = (typeof INTEREST_THEME_OPTIONS)[number];

/** 日別詳細画面などで使う、Question+Answerの結合ビュー */
export interface QuestionWithAnswer extends Question {
  answer: Answer | null;
}

/** 「今日の質問」画面がまとめて扱う1日分のデータ */
export interface DailyEntryDetail extends DailyEntry {
  questions: QuestionWithAnswer[];
}
