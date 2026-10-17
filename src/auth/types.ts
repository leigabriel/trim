import type { Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/** Row shape from the profiles table. */
export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** True until the session read finishes. */
  isLoading: boolean;
  /**
   * True while the profiles row is being fetched. Separate from isLoading
   * because a null profile is ambiguous until the query has settled: it means
   * either "no row yet" or "still loading", and only one of those is a reason
   * to send a returning customer back through the username form.
   */
  isProfileLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveUsername: (input: string) => Promise<{ ok: boolean; error?: string }>;

  /**
   * Creates an account. Does not sign the customer in: Supabase emails them a
   * code first, and verifyEmailCode is what completes the registration.
   */
  register: (input: {
    email: string;
    username: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;

  /** Completes registration with the emailed code, establishing the session. */
  verifyEmailCode: (email: string, token: string) => Promise<{ ok: true } | { ok: false; error: string }>;

  resendEmailCode: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;

  signInWithPassword: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;

  /** Whether an email already has a profile row, so the username is taken. */
  isUsernameTaken: (username: string) => Promise<boolean>;
}
