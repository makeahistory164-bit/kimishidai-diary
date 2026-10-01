/**
 * 要件定義書 11.4「カレンダー表示への変換」で定義される
 * 暖色（低スコア）→グレー（中間）→緑（高スコア）の二極配色。
 * 8.1（完了後スコア表示）・8.3（日別詳細）・8.2（カレンダー）・8.6（ペイウォール）で
 * 共通のビジュアル言語として使い回す。
 */

// グラデーションバー（8.1/8.3/8.6）用の連続カラーストップ
export const AXIS_GRADIENT_COLORS = [
  '#D9482F', // 最も濃い暖色（軸が大きくブレた日）
  '#EF8460', // 薄い暖色
  '#D8D8DE', // 中間帯：ニュートラルなグレー
  '#7CBE8C', // 薄い緑
  '#1F7A45', // 最も濃い緑（自分軸を保てた日）
] as const;

// カレンダーセル（8.2）用の5段階離散配色
const CALENDAR_STAGE_COLORS = [
  '#D9482F', // 0-20
  '#EF8460', // 20-40
  '#D8D8DE', // 40-60
  '#7CBE8C', // 60-80
  '#1F7A45', // 80-100
] as const;

/** 未実施日（DailyEntryレコードなし）: 塗りなし、数字だけ薄く */
export const UNANSWERED_TEXT_COLOR = '#C7C7CC';
export const UNANSWERED_BACKGROUND = 'transparent';

/** 0〜100の軸スコアから、カレンダーセルの5段階配色を返す（11.4） */
export function getCalendarStageColor(axisScore: number): string {
  const stage = Math.min(4, Math.floor(Math.max(0, Math.min(100, axisScore)) / 20));
  return CALENDAR_STAGE_COLORS[stage];
}

/** 8.3: 設問ごとの小さな色ドット用（スコアが連続的なので線形補間） */
export function getAxisScoreColor(axisScore: number): string {
  const clamped = Math.max(0, Math.min(100, axisScore));
  const segment = clamped / 100; // 0..1
  const stops = AXIS_GRADIENT_COLORS;
  const scaled = segment * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const t = scaled - index;
  return interpolateHexColor(stops[index], stops[index + 1], t);
}

function interpolateHexColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// アプリ全体の基調色（ニュートラル系。回答UI等は色ヒントを出さないためここを使う）
export const NEUTRAL_COLORS = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E5E5EA',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B70',
  accent: '#3A3A3C', // 回答ボタン等、スコアを示唆しない中立アクセント
  /** accentやスコア色の上に載せる文字色。各所に'#FFFFFF'と手打ちされていたのを集約 */
  onAccent: '#FFFFFF',
  /** エラー表示。ここ以外で赤を使わないこと */
  danger: '#C0392B',
} as const;
