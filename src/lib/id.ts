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

export function nowIso(): string {
  return new Date().toISOString();
}
