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

export const supabase = createClient(url, key);