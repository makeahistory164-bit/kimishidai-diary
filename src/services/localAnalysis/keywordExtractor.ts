import TinySegmenter from 'tiny-segmenter';
import { STOPWORDS } from '@/constants/stopwords';

/**
 * 10.2: 自由記述メモをAIに送らず、ローカルでキーワード抽出した単語のみを渡す。
 * 実装方式（MVP確定）: TinySegmenter（辞書不要の軽量分かち書き）+ 固定ストップワードリスト
 * + 出現頻度上位語の抽出。
 *
 * 9.4: この抽出結果はDBに永続化しない一時データ（都度memoから再計算する）。
 */

let segmenter: TinySegmenter | null = null;

function getSegmenter(): TinySegmenter | null {
  if (segmenter) return segmenter;
  try {
    segmenter = new TinySegmenter();
    return segmenter;
  } catch {
    // Hermes等の実行環境でRegExp.prototype.compile非対応等により
    // 初期化に失敗した場合は簡易フォールバックへ切り替える
    return null;
  }
}

/** TinySegmenterが使えない環境向けの簡易フォールバック分割（記号・空白区切り） */
function fallbackTokenize(text: string): string[] {
  return text
    .split(/[\s、。！？!?,.・「」（）()]+/)
    .filter((t) => t.length > 0);
}

function isMeaningfulToken(token: string): boolean {
  if (token.length < 2) return false; // 1文字語（助詞の断片等）は除外
  if (STOPWORDS.has(token)) return false;
  if (/^[0-9０-９]+$/.test(token)) return false; // 数字のみは除外
  return true;
}

/**
 * 複数日分の自由記述メモから、頻出キーワードを上位N件抽出する。
 * @param memos 直近期間の自由記述メモ（生テキストはこの関数のスコープ外に出さないこと）
 * @param topN 抽出する件数（10.3のサマリー例に合わせデフォルト4件）
 */
export function extractKeywords(memos: string[], topN = 4): string[] {
  const seg = getSegmenter();
  const frequency = new Map<string, number>();

  for (const memo of memos) {
    if (!memo || !memo.trim()) continue;
    const tokens = seg ? seg.segment(memo) : fallbackTokenize(memo);
    for (const token of tokens) {
      const trimmed = token.trim();
      if (!isMeaningfulToken(trimmed)) continue;
      frequency.set(trimmed, (frequency.get(trimmed) ?? 0) + 1);
    }
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}
