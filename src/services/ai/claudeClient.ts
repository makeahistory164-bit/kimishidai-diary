/**
 * 6.1 / 7章: Claude API（Anthropic Messages API）を直接呼び出す薄いラッパー。
 *
 * 【重要: セキュリティ上の注意】
 * MVP（個人利用〜小規模検証）ではクライアントから直接APIキーを使って呼び出す設計を
 * 許容しているが、一般公開時はAPIキーがアプリバンドルに同梱され抽出可能になるため、
 * 本番ではサーバー（プロキシ）経由での呼び出しに置き換えることを強く推奨する。
 *
 * APIキーは環境変数 EXPO_PUBLIC_ANTHROPIC_API_KEY から読み込む（.env参照）。
 */
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'; // 低コスト・低レイテンシ重視（7章: 体感3秒以内目標）

export class ClaudeApiError extends Error {}

interface CallClaudeOptions {
  system: string;
  userMessage: string;
  toolName: string;
  toolDescription: string;
  toolInputSchema: Record<string, unknown>;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Claude Messages APIをtool_choiceで呼び出し、構造化JSONを直接取得する。
 * 自由記述の応答をJSON.parseする方式より確実に構造化データを得られる。
 */
export async function callClaudeForStructuredOutput<T>(
  options: CallClaudeOptions
): Promise<T> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeApiError('EXPO_PUBLIC_ANTHROPIC_API_KEY が設定されていません');
  }

  const model = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        // Web（expo start --web）検証時にブラウザから直接叩けるようにするフラグ。
        // ネイティブ(iOS/Android)のfetchには影響しない。
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 1024,
        system: options.system,
        messages: [{ role: 'user', content: options.userMessage }],
        tools: [
          {
            name: options.toolName,
            description: options.toolDescription,
            input_schema: options.toolInputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: options.toolName },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new ClaudeApiError(`Claude API error: ${response.status} ${bodyText}`);
    }

    const data = await response.json();
    const toolUseBlock = (data?.content ?? []).find(
      (block: { type: string }) => block.type === 'tool_use'
    );
    if (!toolUseBlock) {
      throw new ClaudeApiError('Claude APIレスポンスにtool_useブロックが含まれていません');
    }
    return toolUseBlock.input as T;
  } finally {
    clearTimeout(timeout);
  }
}
