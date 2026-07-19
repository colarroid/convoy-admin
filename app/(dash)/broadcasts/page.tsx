import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import { PageHeader, SectionStrip } from '@/components/ui'

export const dynamic = 'force-dynamic'

async function sendBroadcast(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const communityId = String(formData.get('community') ?? '').trim() // '' = everyone
  if (!title) return

  const db = supabaseAdmin()
  let ids: string[] = []

  if (communityId) {
    // Participants of one community = hosts who offered there + riders who requested there.
    const [{ data: hosts }, { data: riders }] = await Promise.all([
      db.from('trips').select('host_id').eq('community_id', communityId),
      db.from('join_requests').select('rider_id, trips!inner(community_id)').eq('trips.community_id', communityId),
    ])
    const set = new Set<string>()
    ;(hosts ?? []).forEach((h: any) => h.host_id && set.add(h.host_id))
    ;(riders ?? []).forEach((r: any) => r.rider_id && set.add(r.rider_id))

    if (set.size > 0) {
      const { data: active } = await db.from('profiles').select('id').in('id', Array.from(set)).eq('suspended', false)
      ids = (active ?? []).map(p => p.id)
    }
  } else {
    const { data: active, error } = await db.from('profiles').select('id').eq('suspended', false)
    if (error) throw new Error(error.message)
    ids = (active ?? []).map(p => p.id)
  }

  if (ids.length > 0) {
    const rows = ids.map(uid => ({ user_id: uid, title, body: body || null, url: url || null }))
    const { error: notifErr } = await db.from('notifications').insert(rows)
    if (notifErr) throw new Error(notifErr.message)
  }

  const { error: logErr } = await db.from('broadcasts').insert({
    title, body: body || null, url: url || null,
    sent_by: admin.id, recipients: ids.length,
    community_id: communityId || null,
  })
  if (logErr) throw new Error(logErr.message)

  revalidatePath('/broadcasts')
  revalidatePath('/')
}

export default async function BroadcastsPage() {
  const db = supabaseAdmin()
  const [{ data: communities }, { data: history }] = await Promise.all([
    db.from('communities').select('id, name').order('name'),
    db.from('broadcasts')
      .select('id, title, body, recipients, created_at, community:communities(name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="max-w-2xl">
      <PageHeader title="Broadcasts" sub="Notify everyone, or just the people active in one community." />

      <form action={sendBroadcast} className="flex flex-col gap-5 mb-12 mt-8">
        <div>
          <label className="block text-sm font-medium mb-1.5">Send to</label>
          <select name="community" defaultValue="" className="field">
            <option value="">All active members</option>
            {(communities ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}, people who offered or requested rides here</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input name="title" required placeholder="e.g. Heads up about this weekend's trips" className="field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Message</label>
          <textarea name="body" rows={3} placeholder="Optional details…" className="field-area" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Link <span className="text-secondary font-normal">(optional)</span></label>
          <input name="url" type="url" placeholder="https://…" className="field" />
        </div>
        <div>
          <button type="submit" className="btn-primary">Send notification</button>
        </div>
      </form>

      <SectionStrip title="Recent broadcasts" />
      <div className="-mx-7 border-b border-border">
        {history && history.length > 0 ? (
          <ul className="divide-y divide-border">
            {history.map((b: any) => (
              <li key={b.id} className="px-7 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.title}</p>
                    {b.body && <p className="text-sm text-secondary mt-0.5 line-clamp-2">{b.body}</p>}
                    <p className="text-xs text-secondary mt-1">
                      <span className="chip bg-neutral text-secondary">{b.community?.name ?? 'All members'}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-secondary">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-secondary mt-0.5">{b.recipients} sent</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary text-center py-10">No broadcasts sent yet.</p>
        )}
      </div>
    </div>
  )
}

