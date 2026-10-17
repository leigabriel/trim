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

  // Deletes the chat rows explicitly rather than leaning on the cascade alone,
  // so a failed auth.users delete cannot leave a half-erased account behind.
  //
  // The conversation ids are read first because chat_messages hangs off
  // chat_conversations: .in() needs the values, not the query that produces
  // them. An earlier version passed that query straight through, and a further
  // one before that matched an empty-string conversation_id, which matches
  // nothing. Both looked like cleanup and were not.
  const { data: conversations } = await admin
    .from('chat_conversations')
    .select('id')
    .eq('user_id', callerId);

  const conversationIds = (conversations ?? []).map((row) => row.id);
  if (conversationIds.length > 0) {
    await admin.from('chat_messages').delete().in('conversation_id', conversationIds);
  }

  await admin.from('chat_conversations').delete().eq('user_id', callerId);
  await admin.from('profiles').delete().eq('id', callerId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(callerId);

  if (deleteError) {
    console.error('Could not delete the account:', deleteError);
    return json({ error: 'Could not delete your account. Try again in a moment.' }, 500);
  }

  return json({ deleted: true });
});