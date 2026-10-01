/**
 * 端末内ローカルDB用の簡易一意ID生成。
 * サーバー同期がないMVPでは衝突耐性の高いUUIDライブラリまでは不要なため、
 * タイムスタンプ＋乱数の軽量実装とする。
 */
export function generateId(prefix?: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/** 対象日のYYYY-MM-DD文字列を返す（ローカルタイムゾーン基準） */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * YYYY-MM-DD を「2026年9月27日（日）」形式にする。
 *
 * DBのキーをそのまま画面に出すとISO形式が日本語UIの中に一つだけ現れてしまうため、
 * 表示する箇所では必ずこれを通すこと。
 *
 * 【注意】new Date('2026-09-27') は日付のみの文字列をUTCとして解釈するので、
 * 日本時間では前日になり曜日がずれる。必ず数値に分解してから組み立てる。
 */
export function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
