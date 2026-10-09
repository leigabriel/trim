import { describe, expect, it } from 'vitest';
import { USERNAME_PATTERN, normaliseUsername, validateUsername } from './username';

describe('USERNAME_PATTERN', () => {
  // Pinned: normaliseUsername lowercases first, so a widened class is invisible
  // through validateUsername alone.
  it('is exactly ^[a-z0-9_]{3,24}$ with no flags', () => {
    expect(USERNAME_PATTERN.source).toBe('^[a-z0-9_]{3,24}$');
    expect(USERNAME_PATTERN.flags).toBe('');
  });

  it('does not match uppercase input', () => {
    expect(USERNAME_PATTERN.test('ABC')).toBe(false);
    expect(USERNAME_PATTERN.test('gabriel')).toBe(true);
  });

  it('admits underscores and digits', () => {
    expect(USERNAME_PATTERN.test('ab_c9')).toBe(true);
  });
});

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

  // Guards a class dropping `_` or `0-9`; the rest are pure letters.
  it('accepts underscores and digits and returns them as the value', () => {
    expect(validateUsername('ab_c9')).toEqual({ ok: true, value: 'ab_c9' });
  });

  it('rejects one below the minimum length', () => {
    expect(validateUsername('ab')).toEqual({ ok: false, error: 'Use at least 3 characters.' });
  });

  it('rejects one above the maximum length', () => {
    expect(validateUsername('a'.repeat(25))).toEqual({ ok: false, error: 'Use at most 24 characters.' });
  });

  it('rejects characters outside the rule', () => {
    const invalid = { ok: false, error: 'Use lowercase letters, numbers and underscores only.' };

    expect(validateUsername('has space')).toEqual(invalid);
    expect(validateUsername('has-dash')).toEqual(invalid);
    expect(validateUsername('has.dot')).toEqual(invalid);
  });

  it('rejects empty input with a specific message', () => {
    expect(validateUsername('')).toEqual({ ok: false, error: 'Enter a username.' });
  });
});