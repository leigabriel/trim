/**
 * Provider calls and the failover between them.
 *
 * Both providers are reached through an OpenAI-compatible chat completions
 * surface, so there is one request shape and one response shape. That keeps the
 * failover to a loop rather than two parallel implementations.
 *
 * Nothing here touches Deno, so vitest can import it directly.
 */

export type ProviderId = 'gemini' | 'openrouter';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ProviderConfig {
  id: ProviderId;
  url: string;
  apiKey: string;
  model: string;
}

export interface ProviderResult {
  provider: ProviderId;
  content: string;
}

export interface ProviderFailure {
  provider: ProviderId;
  status: number;
  body: string;
}

/** Wall clock for one provider call. Generous, because a cold start is slow. */
export const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Whether a failure from one provider is worth retrying on the other.
 *
 * Retryable: rate limits, timeouts and server errors, plus auth errors. An
 * invalid Gemini key should not take the whole feature down when a working
 * OpenRouter key exists, so 401/403 fall through too.
 *
 * Not retryable: 400 and 404. A malformed or unknown request fails identically
 * on both providers, so retrying only doubles the wait before the same error.
 */
export function shouldFailover(status: number): boolean {
  // 0 = abort, DNS failure, connection reset (from the catch block).
  if (status === 0) return true;
  if (status === 429 || status === 408) return true;
  if (status >= 500 && status <= 599) return true;
  if (status === 401 || status === 403) return true;
  return false;
}

/** Reads the reply out of an OpenAI-shaped completion. */
export function readContent(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const message = (choices[0] as { message?: { content?: unknown } } | undefined)?.message;
  const content = message?.content;

  return typeof content === 'string' && content.trim().length > 0 ? content : null;
}

/**
 * Calls one provider. Returns a failure rather than throwing, so the caller
 * can decide whether the next provider is worth trying.
 */
export async function callProvider(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<ProviderResult | ProviderFailure> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        // Hair advice wants short, direct answers, not essays.
        max_tokens: 600,
        temperature: 0.6,
      }),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      return { provider: config.id, status: response.status, body: text.slice(0, 400) };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      // A 200 with a body that is not JSON means the endpoint or key is wrong.
      return { provider: config.id, status: 502, body: text.slice(0, 400) };
    }

    const content = readContent(payload);
    if (content === null) {
      return { provider: config.id, status: 502, body: text.slice(0, 400) };
    }

    return { provider: config.id, content };
  } catch (error) {
    // Abort, DNS failure, connection reset: all worth trying the other provider.
    const reason = error instanceof Error ? error.message : String(error);
    return { provider: config.id, status: 0, body: reason };
  } finally {
    clearTimeout(timer);
  }
}

export const isFailure = (
  result: ProviderResult | ProviderFailure,
): result is ProviderFailure => 'status' in result;

/**
 * Runs the providers in order, falling through only on retryable failures.
 * A non-retryable failure is returned immediately rather than being retried
 * somewhere it cannot succeed.
 */
export async function callWithFailover(
  providers: ProviderConfig[],
  messages: ChatMessage[],
): Promise<{ ok: true; value: ProviderResult } | { ok: false; errors: ProviderFailure[] }> {
  const errors: ProviderFailure[] = [];

  for (const provider of providers) {
    const result = await callProvider(provider, messages);

    if (!isFailure(result)) return { ok: true, value: result };

    errors.push(result);
    if (!shouldFailover(result.status)) break;
  }

  return { ok: false, errors };
}