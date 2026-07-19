import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import Pagination from '@/components/Pagination'
import { PageHeader, Toolbar } from '@/components/ui'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

async function cancelTrip(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabaseAdmin().from('trips').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
  revalidatePath('/')
}

// Derived display state: the DB `status` is open until the host confirms, so a
// past open trip is really "awaiting confirmation", and a 0-seat open trip is "full".
function tripBadge(t: { status: string; departs_at: string | null; seats_open: number }) {
  if (t.status === 'cancelled') return { label: 'Cancelled', cls: 'bg-neutral text-secondary' }
  if (t.status === 'completed') return { label: 'Completed', cls: 'bg-green-50 text-green-600' }
  const past = !!t.departs_at && new Date(t.departs_at).getTime() < Date.now()
  if (past) return { label: 'Awaiting confirmation', cls: 'bg-amber-50 text-amber-600' }
  if (t.seats_open === 0) return { label: 'Full', cls: 'bg-amber-50 text-amber-700' }
  return { label: 'Open', cls: 'bg-blue-50 text-blue-600' }
}

const STATUSES = ['open', 'completed', 'cancelled'] as const

export default async function TripsPage({ searchParams }: { searchParams: { status?: string; community?: string; page?: string } }) {
  const db = supabaseAdmin()
  const status = STATUSES.includes(searchParams.status as any) ? searchParams.status : ''
  const communityId = (searchParams.community ?? '').trim()
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const fromRow = (page - 1) * PAGE_SIZE

  const { data: communities } = await db.from('communities').select('id, name').order('name')

  let query = db
    .from('trips')
    .select(`
      id, depart_date, depart_time, departs_at, pickup_point, status, seats_total, seats_open, created_at,
      host:profiles!trips_host_id_fkey ( first_name, last_name ),
      community:communities ( name, code )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (communityId) query = query.eq('community_id', communityId)

  const { data: trips, count } = await query

  const qs = (next: Record<string, string>) => {
    const p = new URLSearchParams()
    if (next.status ?? status) p.set('status', next.status ?? status)
    if (next.community ?? communityId) p.set('community', next.community ?? communityId)
    const s = p.toString()
    return s ? `/trips?${s}` : '/trips'
  }

  return (
    <div>
      <PageHeader title="Trips" sub="Every posted ride. Cancel one if it breaks the rules." />

      <Toolbar>
        <Link href={qs({ status: '' })} className={`chip ${!status ? 'bg-primary text-white' : 'bg-neutral text-secondary hover:bg-subtle'}`}>All</Link>
        {STATUSES.map(s => (
          <Link key={s} href={qs({ status: s })} className={`chip capitalize ${status === s ? 'bg-primary text-white' : 'bg-neutral text-secondary hover:bg-subtle'}`}>{s}</Link>
        ))}
        <form className="ml-auto flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="community" defaultValue={communityId} className="field !w-56">
            <option value="">All communities</option>
            {(communities ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-secondary">Filter</button>
        </form>
      </Toolbar>

      <div className="sheet-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-secondary">
              <th className="font-medium px-4 py-3">When</th>
              <th className="font-medium px-4 py-3">Host</th>
              <th className="font-medium px-4 py-3">Community</th>
              <th className="font-medium px-4 py-3">Pickup</th>
              <th className="font-medium px-4 py-3">Seats</th>
              <th className="font-medium px-4 py-3">Status</th>
              <th className="font-medium px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {trips && trips.length > 0 ? trips.map((t: any) => {
              const host = [t.host?.first_name, t.host?.last_name].filter(Boolean).join(' ').trim() || '-'
              const badge = tripBadge(t)
              const active = t.status === 'open'
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-subtle/60 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/trips/${t.id}`} className="hover:underline">
                      <div className="font-medium">{new Date(t.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                      <div className="text-xs text-secondary">{t.depart_time}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{host}</td>
                  <td className="px-4 py-3 text-secondary">{t.community?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-secondary max-w-[16rem] truncate">{t.pickup_point}</td>
                  <td className="px-4 py-3 text-secondary">{t.seats_open}/{t.seats_total}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {active ? (
                      <form action={cancelTrip}>
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors">
                          Cancel
                        </button>
                      </form>
                    ) : <span className="text-xs text-secondary">-</span>}
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-secondary">No trips yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/trips" params={{ status, community: communityId }} />
    </div>
  )
}
