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
