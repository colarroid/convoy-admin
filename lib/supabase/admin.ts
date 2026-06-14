import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Service-role client — bypasses RLS for privileged admin reads/writes.
 * Created lazily (only at request time) so the app builds without the key set.
 * SERVER ONLY. Never import this into a client component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  }
  return client
}
