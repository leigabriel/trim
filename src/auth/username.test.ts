import { describe, expect, it } from 'vitest';
import { normaliseUsername, validateUsername } from './username';

describe('normaliseUsername', () => {
  it('lowercases and trims', () => {
    expect(normaliseUsername('  Gabriel  ')).toBe('gabriel');
  });
});

describe('validateUsername', () => {
  it('accepts a valid name after normalising', () => {
    expect(validateUsername(' Gabriel ')).toEqual({ ok: true, value: 'gabriel' });
  });

  it('accepts the exact length bounds', () => {
    expect(validateUsername('abc').ok).toBe(true);
    expect(validateUsername('a'.repeat(24)).ok).toBe(true);
  });

  it('rejects one below the minimum length', () => {
    expect(validateUsername('ab').ok).toBe(false);
  });

  it('rejects one above the maximum length', () => {
    expect(validateUsername('a'.repeat(25)).ok).toBe(false);
  });

  it('rejects characters outside the rule', () => {
    expect(validateUsername('has space').ok).toBe(false);
    expect(validateUsername('has-dash').ok).toBe(false);
    expect(validateUsername('has.dot').ok).toBe(false);
  });

  it('rejects empty input with a specific message', () => {
    expect(validateUsername('')).toEqual({ ok: false, error: 'Enter a username.' });
  });
});