import { describe, expect, it } from 'vitest';
import { mapProfile } from './AuthProvider';

describe('mapProfile', () => {
  it('maps snake_case columns to the Profile shape', () => {
    const row = {
      id: 'u1',
      username: 'gabriel',
      display_name: 'Lei Gabriel',
      avatar_url: 'https://cdn.test/a.png',
    } as never;

    expect(mapProfile(row)).toEqual({
      id: 'u1',
      username: 'gabriel',
      displayName: 'Lei Gabriel',
      avatarUrl: 'https://cdn.test/a.png',
    });
  });

  it('returns null when there is no row', () => {
    expect(mapProfile(null)).toBeNull();
  });

  it('preserves a null username so the guard can detect an unset one', () => {
    const row = { id: 'u1', username: null, display_name: null, avatar_url: null } as never;
    expect(mapProfile(row)?.username).toBeNull();
  });
});
