import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveCommunity, rejectCommunity, suspendCommunity, reactivateCommunity } from './actions'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-50 text-blue-600',
  full: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-neutral text-secondary',
}

const COMMUNITY_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  active: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  suspended: 'bg-neutral text-secondary',
}

export default async function CommunityDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseAdmin()

  const { data: community } = await db
    .from('communities')
    .select('id, code, name, address, area, logo_url, status, review_note, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!community) notFound()

  // Self-serve communities have an owner; admin-created ones may not.
  const { data: ownerRow } = await db
    .from('community_owners')
    .select('user_id, created_at, owner:profiles ( first_name, last_name )')
    .eq('community_id', params.id)
    .maybeSingle()
  let ownerEmail: string | null = null
  if (ownerRow?.user_id) {
    const { data: u } = await db.auth.admin.getUserById(ownerRow.user_id)
    ownerEmail = u?.user?.email ?? null
  }
  const ownerName = ownerRow
    ? [(ownerRow.owner as any)?.first_name, (ownerRow.owner as any)?.last_name].filter(Boolean).join(' ').trim()
    : ''

  const { data: trips } = await db
    .from('trips')
    .select(`
      id, depart_date, depart_time, status, seats_total, seats_open,
      host:profiles!trips_host_id_fkey ( first_name, last_name )
    `)
    .eq('community_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const approve = approveCommunity.bind(null, community.id)
  const suspend = suspendCommunity.bind(null, community.id)
  const reactivate = reactivateCommunity.bind(null, community.id)
  async function reject(formData: FormData) {
    'use server'
    await rejectCommunity(params.id, String(formData.get('note') ?? ''))
  }

  return (
    <div>
      <Link href="/communities" className="text-sm text-secondary hover:text-primary transition-colors">← Communities</Link>

      <div className="flex items-start justify-between gap-4 mt-3 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral border border-border flex items-center justify-center shrink-0">
            {community.logo_url
              ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
              : <span className="font-semibold text-secondary">{community.name?.[0]?.toUpperCase() ?? 'C'}</span>}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>{community.name}</h1>
              <span className={`chip capitalize ${COMMUNITY_STATUS_STYLE[community.status] ?? 'bg-neutral text-secondary'}`}>
                {community.status}
              </span>
            </div>
            <p className="text-sm text-secondary mt-0.5 font-mono">{community.code}</p>
          </div>
        </div>
        <Link href={`/communities/${community.id}/edit`} className="btn-secondary">Edit</Link>
      </div>

      {/* ── Review ── */}
      <div className="card mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {ownerRow ? 'Self-serve community' : 'Created by Veesaa'}
            </p>
            {ownerRow && (
              <p className="text-sm text-secondary mt-0.5">
                Owner: {ownerName || 'Member'}{ownerEmail ? ` · ${ownerEmail}` : ''}
              </p>
            )}
            {community.status === 'rejected' && community.review_note && (
              <p className="text-sm text-red-600 mt-1.5">Rejection note: {community.review_note}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(community.status === 'pending' || community.status === 'rejected') && (
              <form action={approve}><button className="btn-primary">Approve</button></form>
            )}
            {community.status === 'active' && (
              <form action={suspend}><button className="btn-secondary text-red-600">Suspend</button></form>
            )}
            {community.status === 'suspended' && (
              <form action={reactivate}><button className="btn-primary">Reactivate</button></form>
            )}
          </div>
        </div>

        {community.status === 'pending' && (
          <form action={reject} className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <input
              name="note"
              placeholder="Reason (sent to the owner)"
              className="field flex-1 min-w-[220px]"
            />
            <button className="btn-secondary text-red-600">Reject</button>
          </form>
        )}
      </div>

      <dl className="card text-sm grid grid-cols-[7rem_1fr] gap-y-2 mb-8">
        <dt className="text-secondary">Address</dt>
        <dd>{community.address ?? '-'}</dd>
        <dt className="text-secondary">Area</dt>
        <dd>{community.area ?? '-'}</dd>
        <dt className="text-secondary">Created</dt>
        <dd>{new Date(community.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
      </dl>

      <h2 className="text-sm font-medium mb-3">Trips in this community</h2>
      <div className="card p-0 overflow-hidden">
        {trips && trips.length > 0 ? (
          <table className="w-full text-sm">
            <tbody>
              {trips.map((t: any) => {
                const host = [t.host?.first_name, t.host?.last_name].filter(Boolean).join(' ').trim() || '-'
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-subtle/60">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/trips/${t.id}`} className="font-medium hover:underline">
                        {new Date(t.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {t.depart_time}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-secondary">{host}</td>
                    <td className="px-4 py-3 text-secondary">{t.seats_open}/{t.seats_total} seats</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`chip capitalize ${STATUS_STYLE[t.status] ?? 'bg-neutral text-secondary'}`}>{t.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-secondary text-center py-10">No trips posted in this community yet.</p>
        )}
      </div>
    </div>
  )
}
