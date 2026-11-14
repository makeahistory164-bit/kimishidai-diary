/**
 * 無料で閲覧できる範囲の判定（要件書12.2: 直近3ヶ月）。
 *
 * 【なぜ独立したモジュールにしたか ★変更前に読むこと】
 * 以前はこの判定が useCalendarMonth.ts の中だけにあり、カレンダーの月遷移を
 * ブロックする用途にしか使われていなかった。そのため日別詳細画面（day/[date].tsx）は
 * 判定を持たず、ディープリンクで直接開くと無料範囲外の記録が閲覧できた。
 *
 * 修正にあたって day/[date].tsx へ判定をコピーすると、「直近3ヶ月」というルールが
 * 2箇所に増える。このプロジェクトは過去に、同じ値を複数箇所から書いたことで
 * 不整合を起こしている（schema.ts の user_version の件）。同じ轍を踏まないよう、
 * ルールの記述はこのファイル1箇所に集約する。
 *
 * 無料範囲を変更するときは FREE_RANGE_MONTHS だけを変えること。
 *
 * 【データは消していない】
 * 制限はあくまで閲覧の制限で、履歴は課金状況に関わらず全期間が端末内に残っている
 * （releaseFlags.ts の PREMIUM_UI_ENABLED 参照）。制限を外しても戻しても
 * データの欠落や不整合は起きない。
 */

/** 12.2: 無料で閲覧できるのは直近3ヶ月 */
export const FREE_RANGE_MONTHS = 3;

/** 年と月を、比較できる通し番号に変換する（2026年1月 → 24311） */
function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/**
 * 指定の年月が無料範囲内か。
 *
 * 当月を0として、FREE_RANGE_MONTHS ヶ月前までが無料。
 * 未来の月は範囲外として false を返す（カレンダーは未来へ進めない仕様だが、
 * ディープリンクで未来日を開かれる可能性があるため、ここでも弾く）。
 */
export function isWithinFreeRange(year: number, month: number, now: Date = new Date()): boolean {
  const diff = monthIndex(now.getFullYear(), now.getMonth() + 1) - monthIndex(year, month);
  return diff >= 0 && diff < FREE_RANGE_MONTHS;
}

/**
 * 'YYYY-MM-DD' から年と月を取り出す。形式が不正なら null。
 *
 * day/[date].tsx はURLパラメータを受け取るため、値が壊れている可能性がある。
 * new Date(dateKey) を使わないのは、日付のみの文字列がUTCとして解釈され
 * 日本時間では前日になるため（lib/id.ts の formatDateLabel と同じ理由）。
 */
export function parseDateKey(dateKey: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month };
}
