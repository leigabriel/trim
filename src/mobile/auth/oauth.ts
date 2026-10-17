import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

import { supabase } from '../../lib/supabase';

/**
 * Google sign-in on the phone.
 *
 * The web app finishes PKCE at /auth/callback over HTTP. A native app cannot
 * host an HTTP origin, so the redirect comes back as
 * com.trim.app://auth/callback?code=..., which Android hands to the app rather
 * than a browser. That deep link is what this listens for.
 *
 * Returns true when it consumed a link, so the caller knows not to also try to
 * read the code out of the URL.
 */
export const watchForOAuthRedirect = async (
  onError: (message: string) => void,
): Promise<PluginListenerHandle | null> => {
  const handle = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('auth/callback')) return;

    const code = parsed.searchParams.get('code');
    const providerError = parsed.searchParams.get('error_description');

    if (providerError) {
      onError(providerError);
      return;
    }

    if (!code) {
      onError('Google sign in came back without a code. Try again.');
      return;
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) onError(error.message);
  });

  return handle;
};

/**
 * Swallows a cold start that began at the redirect link.
 *
 * Without this the app launches, reads no session, shows the login sheet, and
 * only then realises it has a code sitting in the launch URL.
 */
export const consumeLaunchRedirect = async (
  onError: (message: string) => void,
): Promise<void> => {
  const launch = await CapacitorApp.getLaunchUrl();
  if (!launch || !launch.url) return;

  const parsed = new URL(launch.url);
  if (!parsed.pathname.startsWith('auth/callback')) return;

  const code = parsed.searchParams.get('code');
  if (!code) {
    onError('Google sign in came back without a code. Try again.');
    return;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) onError(error.message);
};