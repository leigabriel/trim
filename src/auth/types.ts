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
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveUsername: (input: string) => Promise<{ ok: boolean; error?: string }>;
}
