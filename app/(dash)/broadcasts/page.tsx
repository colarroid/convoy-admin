import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function sendBroadcast(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  if (!title) return

  const db = supabaseAdmin()

  // Recipients: every active (non-suspended) member.
  const { data: recipients, error: recErr } = await db
    .from('profiles')
    .select('id')
    .eq('suspended', false)
  if (recErr) throw new Error(recErr.message)

  const ids = (recipients ?? []).map(r => r.id)
  if (ids.length > 0) {
    // One notification row per user → the push edge function fans out the push.
    const rows = ids.map(uid => ({ user_id: uid, title, body: body || null, url: url || null }))
    const { error: notifErr } = await db.from('notifications').insert(rows)
    if (notifErr) throw new Error(notifErr.message)
  }

  const { error: logErr } = await db.from('broadcasts').insert({
    title, body: body || null, url: url || null,
    sent_by: admin.id, recipients: ids.length,
  })
  if (logErr) throw new Error(logErr.message)

  revalidatePath('/broadcasts')
}

export default async function BroadcastsPage() {
  const { data: history } = await supabaseAdmin()
    .from('broadcasts')
    .select('id, title, body, recipients, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Broadcasts</h1>
        <p className="text-sm text-secondary mt-1">Send a notification to every active member.</p>
      </div>

      <form action={sendBroadcast} className="card flex flex-col gap-5 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input name="title" required placeholder="e.g. Service moved to 9am this Sunday" className="field" />
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
          <button type="submit" className="btn-primary">Send to all members</button>
        </div>
      </form>

      <h2 className="text-sm font-medium mb-3">Recent broadcasts</h2>
      <div className="card p-0 overflow-hidden">
        {history && history.length > 0 ? (
          <ul className="divide-y divide-border">
            {history.map(b => (
              <li key={b.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.title}</p>
                    {b.body && <p className="text-sm text-secondary mt-0.5 line-clamp-2">{b.body}</p>}
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
