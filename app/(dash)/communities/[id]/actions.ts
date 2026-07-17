'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'

/**
 * Community review actions. Self-serve communities start 'pending'; approval is
 * what makes their code resolve anywhere in the member app. Every action
 * re-checks the caller is an admin (server actions are publicly invokable).
 * The owner is notified through the notifications pipeline (push + email).
 */

async function notifyOwner(communityId: string, title: string, body: string) {
  const db = supabaseAdmin()
  const { data: owner } = await db
    .from('community_owners').select('user_id').eq('community_id', communityId).maybeSingle()
  if (owner?.user_id) {
    await db.from('notifications').insert({ user_id: owner.user_id, title, body, url: null })
  }
}

export async function approveCommunity(communityId: string) {
  if (!(await getAdminUser())) throw new Error('Not authorised')
  const db = supabaseAdmin()
  const { data: c } = await db
    .from('communities')
    .update({ status: 'active', review_note: null })
    .eq('id', communityId)
    .select('name, code')
    .single()
  if (c) {
    await notifyOwner(
      communityId,
      'Your community is live 🎉',
      `${c.name} has been approved. Share the code ${c.code} with your members to get started. Manage everything at community.veesaa.co.`,
    )
  }
  revalidatePath(`/communities/${communityId}`)
  revalidatePath('/communities')
}

export async function rejectCommunity(communityId: string, note: string) {
  if (!(await getAdminUser())) throw new Error('Not authorised')
  const reason = note.trim() || 'It does not meet our community guidelines.'
  const db = supabaseAdmin()
  const { data: c } = await db
    .from('communities')
    .update({ status: 'rejected', review_note: reason })
    .eq('id', communityId)
    .select('name')
    .single()
  if (c) {
    await notifyOwner(
      communityId,
      'Your community needs changes',
      `${c.name} was not approved. Reason: ${reason} Update the details at community.veesaa.co and it will be reviewed again.`,
    )
  }
  revalidatePath(`/communities/${communityId}`)
  revalidatePath('/communities')
}

export async function suspendCommunity(communityId: string) {
  if (!(await getAdminUser())) throw new Error('Not authorised')
  const db = supabaseAdmin()
  const { data: c } = await db
    .from('communities')
    .update({ status: 'suspended' })
    .eq('id', communityId)
    .select('name')
    .single()
  if (c) {
    await notifyOwner(
      communityId,
      'Your community has been suspended',
      `${c.name} is suspended and its code no longer works. Contact hello@veesaa.co if you think this is a mistake.`,
    )
  }
  revalidatePath(`/communities/${communityId}`)
  revalidatePath('/communities')
}

export async function reactivateCommunity(communityId: string) {
  if (!(await getAdminUser())) throw new Error('Not authorised')
  const db = supabaseAdmin()
  const { data: c } = await db
    .from('communities')
    .update({ status: 'active' })
    .eq('id', communityId)
    .select('name')
    .single()
  if (c) {
    await notifyOwner(communityId, 'Your community is back',
      `${c.name} has been reactivated and its code works again.`)
  }
  revalidatePath(`/communities/${communityId}`)
  revalidatePath('/communities')
}
