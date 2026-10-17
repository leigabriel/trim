import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const navigate = useNavigate();

  // One subscription for the whole app.
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

  // Outside onAuthStateChange: calling Supabase inside it deadlocks.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    let active = true;
    // Set before the query, not after: a returning customer reaches the
    // callback page before this resolves, and a stale false here would read
    // as "no username" and send them through the form again.
    setIsProfileLoading(true);

    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfile(mapProfile(data as ProfileRow | null));
        setIsProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Depends on Supabase Authentication > URL Configuration. This exact URL
      // must be in the Redirect URLs allow-list, or Supabase silently discards
      // it and falls back to the project's Site URL — which is
      // http://localhost:3000 until someone changes it. That failure looks like
      // a successful login that lands on the wrong host.
      //
      // Required entries:
      //   https://trim-one.vercel.app/auth/callback
      //   http://localhost:5173/auth/callback
      //   http://localhost:8100/auth/callback
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/home', { replace: true });
  }, [navigate]);

  const saveUsername = useCallback(
    async (input: string) => {
      const result = validateUsername(input);
      if (!result.ok) return { ok: false, error: result.error };
      if (!userId) return { ok: false, error: 'You are not signed in.' };

      // Upsert, not update: the insert trigger is the only guarantee the row
      // exists, so an update could hit zero rows and strand the user.
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, username: result.value }, { onConflict: 'id' });

      if (error) {
        // 23505 is the unique violation on the username index.
        if (error.code === '23505') return { ok: false, error: 'That name is taken.' };
        return { ok: false, error: 'Could not save your username. Try again.' };
      }

      setProfile((current) => (current ? { ...current, username: result.value } : current));
      return { ok: true };
    },
    [userId],
  );

  const isUsernameTaken = useCallback(async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    return data !== null;
  }, []);

  /**
   * Supabase error text is not worth showing raw, but two cases are specific
   * enough that a generic message would be useless: a username already claimed,
   * and a confirmation that has already been used.
   */
  const readAuthError = useCallback((message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('already registered') || lower.includes('already been registered')) {
      return 'That email already has an account. Sign in instead.';
    }
    if (lower.includes('username') || lower.includes('duplicate key')) {
      return 'That username is taken. Try another.';
    }
    if (lower.includes('invalid login')) {
      return 'That email and password do not match an account.';
    }
    if (lower.includes('token') || lower.includes('expired')) {
      return 'That code is wrong or has expired. Request a new one.';
    }
    return 'Something went wrong. Try again in a moment.';
  }, []);

  const register = useCallback(
    async (input: { email: string; username: string; password: string }) => {
      const { error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          // Read by the handle_new_user trigger into profiles.username.
          data: { username: input.username },
        },
      });

      if (error) return { ok: false as const, error: readAuthError(error.message) };
      return { ok: true as const };
    },
    [readAuthError],
  );

  const verifyEmailCode = useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) return { ok: false as const, error: readAuthError(error.message) };
      return { ok: true as const };
    },
    [readAuthError],
  );

  const resendEmailCode = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { ok: false as const, error: readAuthError(error.message) };
      return { ok: true as const };
    },
    [readAuthError],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { ok: false as const, error: readAuthError(error.message) };
      return { ok: true as const };
    },
    [readAuthError],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      isProfileLoading,
      signInWithGoogle,
      signOut,
      saveUsername,
      register,
      verifyEmailCode,
      resendEmailCode,
      signInWithPassword,
      isUsernameTaken,
    }),
    [
      session,
      profile,
      isLoading,
      isProfileLoading,
      signInWithGoogle,
      signOut,
      saveUsername,
      register,
      verifyEmailCode,
      resendEmailCode,
      signInWithPassword,
      isUsernameTaken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
