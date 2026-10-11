import { describe, expect, it } from 'vitest';

import {
  callWithFailover,
  isFailure,
  readContent,
  shouldFailover,
} from './providers';
import type { ProviderConfig } from './providers';

const provider = (id: 'gemini' | 'openrouter'): ProviderConfig => ({
  id,
  url: 'https://example.test/chat',
  apiKey: 'test-key',
  model: 'test-model',
});

describe('shouldFailover', () => {
  it('retries rate limits, timeouts and server errors', () => {
    expect(shouldFailover(429)).toBe(true);
    expect(shouldFailover(408)).toBe(true);
    expect(shouldFailover(500)).toBe(true);
    expect(shouldFailover(502)).toBe(true);
    expect(shouldFailover(503)).toBe(true);
    expect(shouldFailover(529)).toBe(true);
  });

  it('retries an invalid key, so one bad provider does not take the feature down', () => {
    expect(shouldFailover(401)).toBe(true);
    expect(shouldFailover(403)).toBe(true);
  });

  it('does not retry a request that would fail identically on the other provider', () => {
    // The whole point of the classifier: retrying a 400 only doubles the wait
    // before the same error.
    expect(shouldFailover(400)).toBe(false);
    expect(shouldFailover(404)).toBe(false);
    expect(shouldFailover(422)).toBe(false);
    expect(shouldFailover(200)).toBe(false);
    expect(shouldFailover(0)).toBe(false);
  });
});

describe('readContent', () => {
  it('reads an OpenAI-shaped completion', () => {
    const payload = { choices: [{ message: { content: 'Ask for a 1.5 grade.' } }] };
    expect(readContent(payload)).toBe('Ask for a 1.5 grade.');
  });

  it('returns null on anything it cannot read, rather than throwing', () => {
    expect(readContent(null)).toBeNull();
    expect(readContent('a string')).toBeNull();
    expect(readContent({})).toBeNull();
    expect(readContent({ choices: [] })).toBeNull();
    expect(readContent({ choices: [{}] })).toBeNull();
    // An empty completion is not a usable reply.
    expect(readContent({ choices: [{ message: { content: '   ' } }] })).toBeNull();
  });
});

describe('isFailure', () => {
  it('separates a reply from a failure', () => {
    expect(isFailure({ provider: 'gemini', content: 'hello' })).toBe(false);
    expect(isFailure({ provider: 'gemini', status: 500, body: 'boom' })).toBe(true);
  });
});

describe('callWithFailover', () => {
  const messages = [{ role: 'user' as const, content: 'What suits my face?' }];

  const stubFetch = (responses: Array<{ status: number; body: string }>) => {
    const original = globalThis.fetch;
    let call = 0;

    globalThis.fetch = (async () => {
      const next = responses[Math.min(call, responses.length - 1)];
      call += 1;
      return new Response(next.body, { status: next.status });
    }) as typeof fetch;

    return () => {
      globalThis.fetch = original;
    };
  };

  it('returns the first provider when it works', async () => {
    const restore = stubFetch([
      { status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Low taper.' } }] }) },
    ]);

    const result = await callWithFailover([provider('gemini'), provider('openrouter')], messages);
    restore();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.provider).toBe('gemini');
  });

  it('falls through to the second provider on a retryable failure', async () => {
    const restore = stubFetch([
      { status: 429, body: 'quota exceeded' },
      { status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Low taper.' } }] }) },
    ]);

    const result = await callWithFailover([provider('gemini'), provider('openrouter')], messages);
    restore();

    expect(result.ok).toBe(true);
    // The important assertion: the answer came from the fallback.
    if (result.ok) expect(result.value.provider).toBe('openrouter');
  });

  it('does not call the second provider on a non-retryable failure', async () => {
    let calls = 0;
    const original = globalThis.fetch;

    globalThis.fetch = (async () => {
      calls += 1;
      return new Response('bad request', { status: 400 });
    }) as typeof fetch;

    const result = await callWithFailover([provider('gemini'), provider('openrouter')], messages);
    globalThis.fetch = original;

    expect(result.ok).toBe(false);
    // One call, not two: a 400 would fail the same way again.
    expect(calls).toBe(1);
  });

  it('reports every failure when both providers fail', async () => {
    const restore = stubFetch([
      { status: 429, body: 'gemini quota' },
      { status: 503, body: 'openrouter down' },
    ]);

    const result = await callWithFailover([provider('gemini'), provider('openrouter')], messages);
    restore();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].provider).toBe('gemini');
      expect(result.errors[1].provider).toBe('openrouter');
    }
  });

  it('treats a 200 with an unreadable body as a failure', async () => {
    const restore = stubFetch([{ status: 200, body: 'not json at all' }]);

    const result = await callWithFailover([provider('gemini'), provider('openrouter')], messages);
    restore();

    expect(result.ok).toBe(false);
  });
});