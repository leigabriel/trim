import { describe, expect, it } from 'vitest';

import { buildRequestBody, isTruncated, MAX_TOKENS, readFinishReason } from './providers';
import type { ProviderConfig } from './providers';

const gemini: ProviderConfig = {
  id: 'gemini',
  url: 'https://example.test/chat',
  apiKey: 'test-key',
  model: 'test-model',
};

const openrouter: ProviderConfig = { ...gemini, id: 'openrouter' };

describe('truncation detection', () => {
  it('reads the finish reason off a completion', () => {
    expect(readFinishReason({ choices: [{ finish_reason: 'length' }] })).toBe('length');
    expect(readFinishReason({ choices: [{ finish_reason: 'stop' }] })).toBe('stop');
  });

  it('treats a length finish reason as truncated', () => {
    expect(isTruncated({ choices: [{ finish_reason: 'length' }] })).toBe(true);
  });

  it('treats a normal finish as complete', () => {
    expect(isTruncated({ choices: [{ finish_reason: 'stop' }] })).toBe(false);
    // Some providers omit the field entirely on a clean stop.
    expect(isTruncated({ choices: [{}] })).toBe(false);
  });

  it('does not mistake a missing payload for truncation', () => {
    expect(isTruncated(null)).toBe(false);
    expect(isTruncated({})).toBe(false);
    expect(isTruncated({ choices: [] })).toBe(false);
  });
});

describe('request body', () => {
  it('leaves room for thinking plus the visible answer', () => {
    // Gemini counts thinking tokens against max_tokens. The old 600 left so
    // little for the answer itself that replies were cut mid-sentence.
    expect(MAX_TOKENS).toBeGreaterThanOrEqual(2048);
  });

  it('asks Gemini to think shallowly, which is the documented fix', () => {
    // Google: lower thinking_level rather than shrinking max_output_tokens.
    const body = buildRequestBody(gemini, [{ role: 'user', content: 'hi' }]);

    expect(body.reasoning_effort).toBe('low');
    expect(body.max_tokens).toBe(MAX_TOKENS);
  });

  it('does not send reasoning_effort to OpenRouter', () => {
    // OpenRouter routes to many models and some reject unknown parameters,
    // which would turn a working provider into a 400 and kill the failover.
    const body = buildRequestBody(openrouter, [{ role: 'user', content: 'hi' }]);

    expect(body.reasoning_effort).toBeUndefined();
    expect('reasoning_effort' in body).toBe(false);
  });

  it('lets a provider override the thinking level', () => {
    const deep: ProviderConfig = { ...gemini, reasoningEffort: 'high' };
    expect(buildRequestBody(deep, []).reasoning_effort).toBe('high');
  });
});