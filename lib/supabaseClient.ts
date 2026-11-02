import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

// Used only by server-side repositories. Never use a NEXT_PUBLIC secret key.
// Lazy creation lets the build run without access to a live database.
export function getSupabase(): SupabaseClient {
  if (typeof window !== 'undefined') throw new Error('The database client is server-only')
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY on the server')
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  return client
}
