import 'server-only'
import { createServerSupabase } from './supabase/server'

/** Returns the signed-in user IF they are an admin, otherwise null. */
export async function getAdminUser() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle()
  return data ? user : null
}
