import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// createClient validates its own arguments and throws a generic
// "supabaseUrl is required", so check here and say which var is missing.
const missing = [
  ...(!url ? ['VITE_SUPABASE_URL'] : []),
  ...(!key ? ['VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
];

if (missing.length > 0) {
  throw new Error(
    `Missing ${missing.join(' and ')}. Copy .env.example to .env and fill it in.`,
  );
}

// PKCE, not the library's default implicit flow. Implicit returns the session
// tokens in the URL fragment, which /auth/callback does not read; PKCE returns
// a ?code= that the callback exchanges. It also keeps tokens out of the address
// bar and out of browser history.
export const supabase = createClient(url, key, {
  auth: {
    flowType: 'pkce',
    // Off so /auth/callback is the only thing that exchanges the code. Left on,
    // the client auto-exchanges ?code= on init, then the callback tries to
    // exchange the same already-consumed code and reports a failure even though
    // sign-in succeeded.
    detectSessionInUrl: false,
  },
});