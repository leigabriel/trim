/**
 * Permanently deletes the caller's account.
 *
 * Runs on the service role, which bypasses RLS, so it deletes by the id taken
 * from the verified JWT and never from the request body. There is no body.
 *
 * Cascades handle the rest: profiles.id and chat_conversations.user_id both
 * cascade from auth.users, and chat_messages cascade from chat_conversations.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Missing authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // The caller's own token decides who they are.
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Not signed in' }, 401);

  const callerId = userData.user.id;

  // Optional. The body carries a confirmation, never an identity.
  try {
    const body = await req.json();
    if (body?.confirm !== 'DELETE') {
      return json({ error: 'Confirmation missing' }, 400);
    }
  } catch {
    return json({ error: 'Confirmation missing' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Best effort, so a half-finished cascade does not leave rows behind. The
  // auth.users delete is the one that has to succeed; everything cascades.
  await admin.from('chat_messages').delete().eq('conversation_id', '');
  await admin.from('chat_conversations').delete().eq('user_id', callerId);
  await admin.from('profiles').delete().eq('id', callerId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(callerId);

  if (deleteError) {
    console.error('Could not delete the account:', deleteError);
    return json({ error: 'Could not delete your account. Try again in a moment.' }, 500);
  }

  return json({ deleted: true });
});