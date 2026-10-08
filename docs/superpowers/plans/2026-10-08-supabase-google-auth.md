# Supabase auth + customer dashboard — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing login modal real — a customer signs in with Google, is asked for a username, and lands on a dashboard showing their identity.

**Architecture:** One singleton Supabase client wrapped in a React context provider that owns the single `onAuthStateChange` subscription and exposes `{ session, profile, isLoading, signInWithGoogle, signOut, saveUsername }`. Google OAuth uses the browser redirect flow with PKCE; `/auth/callback` performs the code exchange, `/welcome` collects the username, and a route guard protects `/dashboard`.

**Tech Stack:** Ionic 9 + React 19, Vite 8, TypeScript 5.9, react-router-dom 6, `@supabase/supabase-js` 2.x, Vitest 4 with jsdom.

**Spec:** `docs/superpowers/specs/2026-10-08-supabase-google-auth-design.md`

## Global Constraints

- **Browser build only.** Capacitor native Google sign-in is out of scope. Do not add `@capgo/capacitor-social-login`, a custom URL scheme, or any Android/iOS manifest edit.
- **One new dependency:** `@supabase/supabase-js`. Add nothing else.
- Env vars are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never prefix a secret with `VITE_` — Vite inlines those into the client bundle. The service role key must never appear anywhere in `src/`.
- Brand colours: orange `#FF622B` (`--trim-orange`), black `--trim-black`, white `--trim-white`. Use the existing CSS custom properties, never hardcoded hex, except where the spec pins a value.
- Username rule, exact: `^[a-z0-9_]{3,24}$`, lowercased client-side before submission.
- Test command is `npx vitest run` (the package script is `test.unit`, with a dot).
- Comments short and concise. No decorative symbols or emoji.
- Do not use Tailwind. It is not installed and must not be.

## Review Focus

Five input classes the spec implies but no happy-path task covers. Each has a test pinned to the task that owns the relevant code.

1. **Username already taken by another account** → Postgres raises `23505` on the unique index. Expected: inline "That name is taken.", input value preserved, no navigation. (Task 6)
2. **Customer dismisses or cancels Google's screen** → callback receives `?error=access_denied`. Expected: a plain message on `/auth/callback` with a link back, never a silent failure or a redirect loop. (Task 5)
3. **Profile row absent** (trigger failed, or row deleted) → `username` save must still succeed. Expected: upsert creates the row; an `update` would affect zero rows and strand the customer forever. (Task 6)
4. **Hard refresh on `/dashboard` with a session but no username** → guard must not bounce to `/home` before the session is read. Expected: brief loading state, then redirect to `/welcome`. (Task 7)
5. **Username typed with uppercase or invalid characters** → client lowercases, then rejects anything outside the rule before any network call. Expected: submit blocked with an inline message, no request to Supabase. (Task 6)

---

### Task 1: Secrets hygiene and dependency

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `package.json` (via npm install)

**Interfaces:**
- Consumes: nothing.
- Produces: gitignored `.env`; committed `.env.example` containing the two variable names; installed `@supabase/supabase-js`.

- [ ] **Step 1: Ignore `.env` and commit `.env.example`**

Append to `.gitignore`:

```gitignore
# Secrets
.env
```

Create `.env.example` with placeholder values only:

```env
# Supabase project settings. Copy to .env and fill in from
# supabase.com/dashboard > Project Settings > API.
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

- [ ] **Step 2: Verify `.env` is ignored and not tracked**

Run: `git check-ignore -v .env`
Expected: outputs `.gitignore:<line>:.env` — the file is now ignored.

Run: `git status --short`
Expected: `.env` does not appear. `.env.example` does appear as untracked.

- [ ] **Step 3: Install the dependency**

Run: `npm install @supabase/supabase-js`
Expected: added to `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 4: Confirm nothing regressed**

Run: `npm run build`
Expected: `built in …`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example package.json package-lock.json
git commit -m "chore: ignore env and add supabase client"
```

---

### Task 2: Username validation as a pure module

Extracted before anything else so the rule has one home and can be tested without a network.

**Files:**
- Create: `src/auth/username.ts`
- Create: `src/auth/username.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `USERNAME_PATTERN: RegExp` — `/^[a-z0-9_]{3,24}$/`
  - `normaliseUsername(input: string): string` — trims, lowercases
  - `validateUsername(input: string): { ok: true; value: string } | { ok: false; error: string }`

- [ ] **Step 1: Write the failing tests**

Create `src/auth/username.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/auth/username.test.ts`
Expected: FAIL — cannot resolve `./username`.

- [ ] **Step 3: Implement `src/auth/username.ts`**

```ts
export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export const normaliseUsername = (input: string): string => input.trim().toLowerCase();

export type UsernameResult = { ok: true; value: string } | { ok: false; error: string };

export const validateUsername = (input: string): UsernameResult => {
  const value = normaliseUsername(input);

  if (!value) return { ok: false, error: 'Enter a username.' };
  if (value.length < 3) return { ok: false, error: 'Use at least 3 characters.' };
  if (value.length > 24) return { ok: false, error: 'Use at most 24 characters.' };
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, error: 'Use lowercase letters, numbers and underscores only.' };
  }
  return { ok: true, value };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/auth/username.test.ts`
Expected: PASS, 7 tests in this file (8 across the suite, counting the pre-existing App test).

- [ ] **Step 5: Commit**

```bash
git add src/auth/username.ts src/auth/username.test.ts
git commit -m "feat: add username validation rules"
```

---

### Task 3: Supabase client and test guard

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `vite.config.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env`.
- Produces: `supabase: SupabaseClient` singleton, exported from `src/lib/supabase.ts`.

- [ ] **Step 1: Create the client**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // Fails loudly in development rather than throwing on a network call later.
  console.warn('Supabase env vars missing. Copy .env.example to .env and fill it in.');
}

export const supabase = createClient(url ?? '', key ?? '');
```

`createClient` validates its arguments at construction, so the `?? ''` fallback keeps the
module importable in tests while `console.warn` surfaces the misconfiguration.

- [ ] **Step 2: Register stub env values for Vitest**

Vitest does not read `.env`, so the client would build with empty strings and warn on
every test run. In `vite.config.ts`, add `env` to the existing `test` block, keeping
every other key:

```ts
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    env: {
      VITE_SUPABASE_URL: 'https://stub.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_stub',
    },
  }
```

`test.env` is applied before any module loads, which is earlier and simpler than an
import-time stub file.

- [ ] **Step 4: Extend the ambient types**

Read `src/vite-env.d.ts` and replace its contents with:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 5: Verify the existing suite still passes**

Run: `npx vitest run`
Expected: PASS, 1 test (`App.test.tsx`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts vite.config.ts src/vite-env.d.ts
git commit -m "feat: add supabase client and test env stub"
```

---

### Task 4: Auth provider

The centre of the feature. One subscription for the whole app.

**Files:**
- Create: `src/auth/AuthProvider.tsx`
- Create: `src/auth/types.ts`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`; `validateUsername` from `src/auth/username.ts`.
- Produces:
  ```ts
  interface Profile {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  }

  interface AuthContextValue {
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    saveUsername: (input: string) => Promise<{ ok: boolean; error?: string }>;
  }
  ```
  - `useAuth(): AuthContextValue` exported from the same file.
  - `mapProfile(row: ProfileRow | null): Profile | null` exported for unit testing.

- [ ] **Step 1: Write the failing test for the row mapper**

Create `src/auth/AuthProvider.test.ts`:

```ts
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

    expect(mapProfile(row, 'u1')).toEqual({
      id: 'u1',
      username: 'gabriel',
      displayName: 'Lei Gabriel',
      avatarUrl: 'https://cdn.test/a.png',
    });
  });

  it('returns null when there is no row', () => {
    expect(mapProfile(null, 'u1')).toBeNull();
  });

  it('preserves a null username so the guard can detect an unset one', () => {
    const row = { id: 'u1', username: null, display_name: null, avatar_url: null } as never;
    expect(mapProfile(row, 'u1')?.username).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/auth/AuthProvider.test.ts`
Expected: FAIL — cannot resolve `./AuthProvider`.

- [ ] **Step 3: Create the shared types**

Create `src/auth/types.ts`:

```ts
import type { Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/** Row shape as it comes back from the profiles table. */
export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveUsername: (input: string) => Promise<{ ok: boolean; error?: string }>;
}
```

- [ ] **Step 4: Implement `src/auth/AuthProvider.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { validateUsername } from './username';
import type { AuthContextValue, Profile, ProfileRow } from './types';

export const mapProfile = (row: ProfileRow | null): Profile | null =>
  row
    ? {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      }
    : null;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Single subscription for the whole app.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Profile fetch lives outside onAuthStateChange: calling Supabase from inside
  // that callback deadlocks.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let active = true;
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(mapProfile(data as ProfileRow | null));
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/home', { replace: true });
  }, [navigate]);

  const saveUsername = useCallback(async (input: string) => {
    const result = validateUsername(input);
    if (!result.ok) return { ok: false, error: result.error };
    if (!userId) return { ok: false, error: 'You are not signed in.' };

    // Upsert, not update: the insert trigger is the only guarantee the row
    // exists, so an update could silently affect zero rows and strand the user.
    const { error } = await supabase.from('profiles').upsert(
      { id: userId, username: result.value },
      { onConflict: 'id' },
    );

    if (error) {
      // Postgres 23505 is the unique violation on the username index.
      if (error.code === '23505') return { ok: false, error: 'That name is taken.' };
      return { ok: false, error: 'Could not save your username. Try again.' };
    }

    setProfile((current) => (current ? { ...current, username: result.value } : current));
    return { ok: true };
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, isLoading, signInWithGoogle, signOut, saveUsername }),
    [session, profile, isLoading, signInWithGoogle, signOut, saveUsername],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
```

The test calls `mapProfile(row)` with one argument, matching the signature in this task's
Interfaces block. Keep them identical.

- [ ] **Step 5: Run the mapper test to verify it passes**

Run: `npx vitest run src/auth/AuthProvider.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Verify nothing regressed**

Run: `npx vitest run && npm run build`
Expected: 11 tests pass, build exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/auth/AuthProvider.tsx src/auth/types.ts src/auth/AuthProvider.test.ts
git commit -m "feat: add auth provider with profile context"
```

---

### Task 5: OAuth callback route

**Files:**
- Create: `src/pages/AuthCallback.tsx`
- Create: `src/pages/AuthCallback.css`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`; `useNavigate` from `react-router-dom`.
- Produces: route element for `/auth/callback`. Exposes no exports beyond the default component.

- [ ] **Step 1: Create the page**

Create `src/pages/AuthCallback.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import './AuthCallback.css';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get('error');

    if (providerError) {
      setError(
        params.get('error_description') ??
          'Sign in was cancelled. You can try again whenever you like.',
      );
      return;
    }

    const code = params.get('code');
    if (!code) {
      setError('Google did not return a sign in code. Try again.');
      return;
    }

    let active = true;
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (!active) return;
      if (exchangeError) {
        setError('Could not complete sign in. Try again.');
        return;
      }
      navigate('/home', { replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="trim-callback">
      {error ? (
        <>
          <p className="trim-callback__error">{error}</p>
          <button className="trim-callback__back" type="button" onClick={() => navigate('/home')}>
            Back to Trim
          </button>
        </>
      ) : (
        <p className="trim-callback__pending">Signing you in</p>
      )}
    </main>
  );
};

export default AuthCallback;
```

- [ ] **Step 2: Style it**

Create `src/pages/AuthCallback.css`:

```css
.trim-callback {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1.5rem;
  min-height: 100%;
  padding: var(--trim-gutter);
  background-color: var(--trim-black);
  color: var(--trim-white);
  text-align: center;
}

.trim-callback__pending {
  margin: 0;
  font-family: var(--trim-font-display);
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1;
}

.trim-callback__error {
  max-width: 40ch;
  margin: 0;
  font-family: var(--trim-font-sans);
  font-size: 1rem;
  line-height: 1.5;
}

.trim-callback__back {
  padding: 0.75rem 1.5rem;
  border: 0;
  background-color: var(--trim-orange);
  color: var(--trim-white);
  font-family: var(--trim-font-display);
  font-size: 1.5rem;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AuthCallback.tsx src/pages/AuthCallback.css
git commit -m "feat: add oauth callback route"
```

---

### Task 6: Welcome route with the username gate

**Files:**
- Create: `src/pages/Welcome.tsx`
- Create: `src/pages/Welcome.css`

**Interfaces:**
- Consumes: `useAuth()` from `src/auth/AuthProvider.tsx` (`session`, `isLoading`, `saveUsername`).
- Produces: route element for `/welcome`. No new exports.

- [ ] **Step 1: Create the page**

Create `src/pages/Welcome.tsx`:

```tsx
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import './Welcome.css';

const Welcome: React.FC = () => {
  const { session, isLoading, saveUsername } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoading && !session) return <Navigate to="/home" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const result = await saveUsername(value);
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error ?? 'Could not save your username.');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="trim-welcome">
      <form className="trim-welcome__form" onSubmit={handleSubmit}>
        <h1 className="trim-welcome__title">What should we call you?</h1>

        <label className="trim-welcome__label" htmlFor="trim-username">
          Username
        </label>

        <input
          id="trim-username"
          className="trim-welcome__input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="yourname"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={isSaving}
        />

        {error && (
          <p className="trim-welcome__error" role="alert">
            {error}
          </p>
        )}

        <button className="trim-welcome__submit" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving' : 'Continue'}
        </button>

        <p className="trim-welcome__hint">3 to 24 characters. Lowercase letters, numbers and underscores.</p>
      </form>
    </main>
  );
};

export default Welcome;
```

- [ ] **Step 2: Style it**

Create `src/pages/Welcome.css`:

```css
.trim-welcome {
  display: grid;
  place-content: center;
  min-height: 100%;
  padding: var(--trim-gutter);
  background-color: var(--trim-black);
  color: var(--trim-white);
}

.trim-welcome__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(100%, 28rem);
}

.trim-welcome__title {
  margin: 0 0 0.5rem;
  font-family: var(--trim-font-brand);
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 1.05;
  color: var(--trim-orange);
}

.trim-welcome__label {
  font-family: var(--trim-font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.7;
}

.trim-welcome__input {
  padding: 0.85rem 1rem;
  border: 1px solid var(--trim-white);
  background: none;
  color: var(--trim-white);
  font-family: var(--trim-font-sans);
  font-size: 1.125rem;
}

.trim-welcome__input:focus-visible {
  outline: 2px solid var(--trim-orange);
  outline-offset: 2px;
}

.trim-welcome__error {
  margin: 0;
  font-family: var(--trim-font-sans);
  font-size: 0.875rem;
  color: var(--trim-orange);
}

.trim-welcome__submit {
  margin-top: 0.5rem;
  padding: 0.9rem 1.5rem;
  border: 0;
  background-color: var(--trim-orange);
  color: var(--trim-white);
  font-family: var(--trim-font-display);
  font-size: 1.75rem;
  cursor: pointer;
}

.trim-welcome__submit:disabled {
  opacity: 0.6;
  cursor: progress;
}

.trim-welcome__hint {
  margin: 0;
  font-family: var(--trim-font-sans);
  font-size: 0.8125rem;
  line-height: 1.5;
  opacity: 0.6;
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Welcome.tsx src/pages/Welcome.css
git commit -m "feat: add username welcome gate"
```

---

### Task 7: Route guard

**Files:**
- Create: `src/auth/RequireAuth.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/auth/AuthProvider.tsx`.
- Produces:
  ```ts
  RequireAuth: React.FC<{ children: ReactNode; requireUsername?: boolean }>
  ```

- [ ] **Step 1: Create the guard**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  /** Route to /welcome when the profile has no username yet. */
  requireUsername?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireUsername }) => {
  const { session, profile, isLoading } = useAuth();

  // Must not redirect while loading, or a hard refresh on a protected route
  // bounces a signed-in customer to /home before the session is read.
  if (isLoading) {
    return (
      <div className="trim-guard" aria-busy="true">
        <span className="trim-visually-hidden">Loading</span>
      </div>
    );
  }

  if (!session) return <Navigate to="/home" replace />;

  if (requireUsername && !profile?.username) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};
```

Add to `src/theme/variables.css`:

```css
.trim-guard {
  min-height: 100%;
  background-color: var(--trim-black);
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/auth/RequireAuth.tsx src/theme/variables.css
git commit -m "feat: add auth route guard"
```

---

### Task 8: Dashboard

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Dashboard.css`

**Interfaces:**
- Consumes: `useAuth()` (`profile`, `signOut`), `Nav` from `../components/layout/Nav`.
- Produces: route element for `/dashboard`. No new exports.

- [ ] **Step 1: Create the page**

```tsx
import { IonContent, IonPage } from '@ionic/react';

import Nav from '../components/layout/Nav';
import { useAuth } from '../auth/AuthProvider';
import { RequireAuth } from '../auth/RequireAuth';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { profile, session, signOut } = useAuth();
  const name = profile?.username ?? profile?.displayName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();

  return (
    <IonPage>
      {/* Light tone: the page behind the nav is black. */}
      <Nav tone="light" />

      <IonContent>
        <RequireAuth requireUsername>
          <div className="trim-dashboard">
            <header className="trim-dashboard__bar">
              <span className="trim-dashboard__brand">Trim</span>
            </header>

            <div className="trim-dashboard__body">
              <aside className="trim-dashboard__side">
                {profile?.avatarUrl ? (
                  <img className="trim-dashboard__avatar" src={profile.avatarUrl} alt="" />
                ) : (
                  <span className="trim-dashboard__initial" aria-hidden="true">
                    {initial}
                  </span>
                )}

                <p className="trim-dashboard__name">{name}</p>
                <p className="trim-dashboard__email">{session?.user.email}</p>

                <button className="trim-dashboard__signout" type="button" onClick={signOut}>
                  Sign out
                </button>
              </aside>

              <main className="trim-dashboard__main" aria-label="Dashboard" />
            </div>
          </div>
        </RequireAuth>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Style it to the supplied wireframe**

Create `src/pages/Dashboard.css`:

```css
/* Black top bar, black sidebar at ~25%, orange main. Border only, no rounding. */
.trim-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-top: var(--trim-nav-height);
  background-color: var(--trim-black);
  color: var(--trim-white);
}

.trim-dashboard__bar {
  display: flex;
  align-items: center;
  min-height: clamp(4rem, 9vw, 7rem);
  padding: 0 var(--trim-gutter);
  border-bottom: 1px dotted rgb(255 255 255 / 30%);
}

.trim-dashboard__brand {
  font-family: var(--trim-font-brand);
  font-size: clamp(1.75rem, 3.5vw, 3rem);
  line-height: 0.9;
  color: var(--trim-orange);
}

.trim-dashboard__body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
}

/* Sidebar is a quarter of the width once there is room; stacked below it on phones. */
.trim-dashboard__side {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: var(--trim-gutter);
  border-right: 1px dotted rgb(255 255 255 / 30%);
}

.trim-dashboard__main {
  min-height: 20rem;
  background-color: var(--trim-orange);
}

@media (min-width: 48rem) {
  .trim-dashboard__body {
    grid-template-columns: 25% minmax(0, 1fr);
  }
}

.trim-dashboard__avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  object-fit: cover;
}

.trim-dashboard__initial {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: var(--trim-orange);
  color: var(--trim-white);
  font-family: var(--trim-font-display);
  font-size: 2rem;
}

.trim-dashboard__name {
  margin: 0;
  font-family: var(--trim-font-display);
  font-size: 1.75rem;
  line-height: 1;
}

.trim-dashboard__email {
  margin: 0;
  font-family: var(--trim-font-sans);
  font-size: 0.8125rem;
  word-break: break-all;
  opacity: 0.7;
}

.trim-dashboard__signout {
  margin-top: auto;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--trim-white);
  background: none;
  color: var(--trim-white);
  font-family: var(--trim-font-display);
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;
}

.trim-dashboard__signout:hover,
.trim-dashboard__signout:focus-visible {
  background-color: var(--trim-orange);
  border-color: var(--trim-orange);
  color: var(--trim-white);
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Dashboard.css
git commit -m "feat: add customer dashboard shell"
```

---

### Task 9: Login modal consent gate

**Files:**
- Modify: `src/components/layout/LoginModal.tsx`
- Modify: `src/components/layout/LoginModal.css`

**Interfaces:**
- Consumes: `useAuth()` from `../../auth/AuthProvider` (`signInWithGoogle`).
- Produces: no new exports. `LoginModal` props unchanged (`isOpen`, `onDismiss`).

- [ ] **Step 1: Add the checkbox and wire the button**

In `LoginModal.tsx`, add `useState` to the React import. Destructure
`const { signInWithGoogle } = useAuth();` and `const [isAgreed, setIsAgreed] = useState(false);`
plus `const [notice, setNotice] = useState<string | null>(null);` and
`const [isRedirecting, setIsRedirecting] = useState(false);`.

Add this handler above the returned JSX:

```tsx
const handleGoogle = async () => {
  if (!isAgreed) {
    setNotice('Please agree to the Terms and Privacy Policy first.');
    return;
  }

  setNotice(null);
  setIsRedirecting(true);
  try {
    await signInWithGoogle();
  } catch {
    // The redirect has already happened on success, so reaching here is a
    // failure worth showing rather than swallowing.
    setIsRedirecting(false);
    setNotice('Could not start Google sign in. Check your connection and try again.');
  }
};
```

Replace the Google button with:

```tsx
<button
  className="trim-login__google"
  type="button"
  onClick={handleGoogle}
  disabled={isRedirecting}
>
  <GoogleIcon className="trim-login__google-icon" />
  <span>{isRedirecting ? 'Opening Google' : 'Continue with Google'}</span>
</button>
```

Replace the legal paragraph with a label wrapping a real checkbox and the notice:

```tsx
<label className="trim-login__consent">
  <input
    className="trim-login__checkbox"
    type="checkbox"
    checked={isAgreed}
    onChange={(event) => {
      setIsAgreed(event.target.checked);
      if (event.target.checked) setNotice(null);
    }}
  />
  <span className="trim-login__legal">
    By continuing, you agree to our <strong>Terms of Service</strong>.
    <br />
    Read our <strong>Privacy Policy</strong>.
  </span>
</label>

{notice && (
  <p className="trim-login__notice" role="alert">
    {notice}
  </p>
)}
```

- [ ] **Step 2: Style the new elements**

Append to `src/components/layout/LoginModal.css`:

```css
.trim-login__consent {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: clamp(1.5rem, 4vw, 3rem);
  cursor: pointer;
}

.trim-login__checkbox {
  flex: 0 0 auto;
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  accent-color: var(--trim-orange);
  cursor: pointer;
}

.trim-login__checkbox:focus-visible {
  outline: 2px solid var(--trim-white);
  outline-offset: 2px;
}

.trim-login__notice {
  margin: 0.75rem 0 0;
  font-family: var(--trim-font-sans);
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--trim-orange);
}

.trim-login__google:disabled {
  opacity: 0.7;
  cursor: progress;
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/LoginModal.tsx src/components/layout/LoginModal.css
git commit -m "feat: gate google sign in behind consent checkbox"
```

---

### Task 10: Nav avatar when signed in

**Files:**
- Modify: `src/components/layout/Nav.tsx`
- Modify: `src/components/layout/Nav.css`

**Interfaces:**
- Consumes: `useAuth()` from `../../auth/AuthProvider` (`session`, `profile`).
- Produces: no new exports. `Nav` props unchanged.

- [ ] **Step 1: Render the avatar in place of the login button**

In `Nav.tsx`, add `useAuth` to the imports and call it inside the component. Replace the
login `<li>` with:

```tsx
{session ? (
  <li>
    <Link
      className="trim-nav__avatar"
      to="/dashboard"
      aria-label={`Dashboard, signed in as ${profile?.username ?? profile?.displayName ?? 'your account'}`}
      onClick={closeMenu}
    >
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" />
      ) : (
        <span aria-hidden="true">{(profile?.username ?? '?').charAt(0).toUpperCase()}</span>
      )}
    </Link>
  </li>
) : (
  <li>
    <button className="trim-nav__link trim-nav__link--button" type="button" onClick={openLogin}>
      login
    </button>
  </li>
)}
```

- [ ] **Step 2: Style it**

Append to `src/components/layout/Nav.css`:

```css
.trim-nav__avatar {
  display: grid;
  place-items: center;
  width: clamp(2.25rem, 3.5vw, 3rem);
  height: clamp(2.25rem, 3.5vw, 3rem);
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--trim-orange);
  color: var(--trim-white);
  font-family: var(--trim-font-display);
  font-size: 1.25rem;
  line-height: 1;
  text-decoration: none;
  transition: transform 200ms ease;
}

.trim-nav__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trim-nav__avatar:hover,
.trim-nav__avatar:focus-visible {
  transform: scale(1.08);
  outline: none;
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Nav.tsx src/components/layout/Nav.css
git commit -m "feat: show account avatar in nav when signed in"
```

---

### Task 11: Wire routes and provider

Nothing works until this lands — it is the task that connects every other task.

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `AuthProvider` from `../auth/AuthProvider`, `RequireAuth` from `../auth/RequireAuth`, `AuthCallback`, `Welcome`, `Dashboard`.
- Produces: routes `/home`, `/about`, `/auth/callback`, `/welcome`, `/dashboard`.

- [ ] **Step 1: Add the imports**

```tsx
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import AuthCallback from './pages/AuthCallback';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
```

- [ ] **Step 2: Wrap the router in the provider and add the routes**

Replace the `<IonReactRouter>` block with:

```tsx
<AuthProvider>
  <IonReactRouter>
    <IonRouterOutlet>
      {/* The intro overlay lives inside the home route: it waits on the hero
          models, and on any other page nothing would ever flip them. */}
      <Route path="/home" element={<HomeWithLoader />} />
      <Route path="/about" element={<About />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth requireUsername>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/home" replace />} />
    </IonRouterOutlet>
  </IonReactRouter>
</AuthProvider>
```

`Dashboard` is an `IonPage` and the guard is not, so the guard sits outside it in the
route element rather than wrapping it inside `IonContent`.

- [ ] **Step 3: Verify the full suite and build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: 11 tests pass, lint exit 0, build exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire auth routes and provider"
```

---

### Task 12: SQL migration file and setup guide

**Files:**
- Create: `supabase/migrations/0001_profiles.sql`
- Create: `step.md`

**Interfaces:**
- Consumes: nothing from earlier tasks. Documents them.
- Produces: the exact SQL from spec section 6, and the setup guide.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/0001_profiles.sql` with the SQL verbatim from section 6 of
the spec — table, both RLS policies, `handle_new_user()` and its trigger. Copy it
exactly; the `security definer` and pinned `search_path` are load-bearing.

- [ ] **Step 2: Write `step.md`**

Create `step.md` at the repo root. It must cover, in order:

1. Create a Supabase project at supabase.com/dashboard.
2. Open the SQL editor and run `supabase/migrations/0001_profiles.sql`.
3. Copy `.env.example` to `.env` and paste the project URL and publishable key from
   Project Settings → API.
4. Generate a Google OAuth client: Google Cloud Console → create project → Google Auth
   Platform → Audience (set the app to External, add the Supabase callback URL to test
   users) → Clients → create a **Web application** client.
5. Add the Web client's authorised JavaScript origin: `http://localhost:5173` for
   development, plus the production origin.
6. In Supabase → Authentication → Providers → Google, paste the client ID and secret.
   Toggle it on.
7. In Supabase → Authentication → URL Configuration, add to Redirect URLs:
   `http://localhost:5173/auth/callback`, plus the production equivalent.
8. Run `npm run dev` and sign in.
9. Manual verification checklist: first sign in creates a `profiles` row; a second
   account cannot select the first one's row; a taken username is rejected with "That
   name is taken."; sign out clears the session; a hard refresh on `/dashboard` returns
   to `/dashboard` rather than `/home`.
10. A troubleshooting table: `invalid_grant` (clock skew or wrong callback URL),
    "Missing or insufficient permissions" (RLS or the trigger lost `security definer`),
    redirect lands on a blank page (`/auth/callback` missing from Redirect URLs).

State clearly at the top that the Supabase and Google steps must be performed by a
human in their own dashboards, and that the service role key must never be placed in a
`VITE_` variable or in `src/`.

- [ ] **Step 3: Verify nothing regressed**

Run: `npx vitest run`
Expected: 11 tests pass.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_profiles.sql step.md
git commit -m "docs: add profiles migration and setup guide"
```

---

## Manual verification

Automated tests cannot cover the Google round-trip without live credentials. After all
twelve tasks, verify by hand using the checklist in `step.md`:

- [ ] Login modal refuses the Google button until the checkbox is ticked, and shows the notice when clicked unticked.
- [ ] Signing in reaches `/home` with the nav showing an avatar.
- [ ] `/dashboard` redirects to `/welcome` until a username is saved.
- [ ] A username already in use produces "That name is taken." and preserves the input.
- [ ] A second Google account cannot read the first account's profile row.
- [ ] Sign out returns to `/home` and the nav shows the word `login` again.