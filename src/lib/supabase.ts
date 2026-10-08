import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // Fails loudly in development rather than throwing on a network call later.
  console.warn('Supabase env vars missing. Copy .env.example to .env and fill it in.')
}

export const supabase = createClient(url ?? '', key ?? '')