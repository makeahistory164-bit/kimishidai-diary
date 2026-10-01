import type { TextStyle } from 'react-native';

/**
 * HIG「Typography」「Layout」に合わせた共通トークン。
 *
 * 【なぜ必要か】以前は各画面が個別に StyleSheet を定義していたため、
 * プライマリボタンが7箇所で4種類の寸法、カードの角丸が12/14/16と
 * ばらついていた。新しい画面を足すたびに差異が増える構造だったので、
 * 寸法と文字サイズの決定をここに集約する。
 *
 * fontSize を直書きせず TYPE を使うこと。
 */

/**
 * HIGのiOS Text Styleに対応する文字種。
 * HIGはiOSの既定サイズを17pt、最小を11ptと定めている。本文は必ず body（17pt）を使う。
 *
 * lineHeight は日本語の可読性を優先して各サイズの約1.45倍にしている
 * （英字より字面が大きく、行間が詰まると読みにくいため）。
 */
export const TYPE = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  /** 本文と同じ大きさで強調したいとき（リスト行のラベル等） */
  headline: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

/** 4の倍数を基本にした余白 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** 角丸。カードは card に統一する（以前は12/14/16が混在していた） */
export const RADIUS = {
  control: 12,
  card: 16,
  pill: 999,
} as const;

/**
 * HIGが定める操作要素の最小タップ寸法。
 * 見た目が小さい要素でも、hitSlop か padding でこの寸法を満たすこと。
 */
export const MIN_TAP = 44;

/** 画面本文の左右余白 */
export const SCREEN_PADDING = SPACING.lg;
