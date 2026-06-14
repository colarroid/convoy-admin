import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-50 text-blue-600',
  full: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-neutral text-secondary',
}
const REQ_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-green-50 text-green-600',
  declined: 'bg-neutral text-secondary',
}
const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseAdmin()

  const { data: trip } = await db
    .from('trips')
    .select(`
      id, depart_date, depart_time, pickup_point, pickup_note, vehicle, color, status,
      seats_total, seats_open, created_at,
      host:profiles!trips_host_id_fkey ( id, first_name, last_name, phone ),
      community:communities ( id, name, code )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!trip) notFound()

  const { data: requests } = await db
    .from('join_requests')
    .select(`
      id, status, created_at,
      rider:profiles!join_requests_rider_id_fkey ( id, first_name, last_name )
    `)
    .eq('trip_id', params.id)
    .order('created_at', { ascending: false })

  const host: any = trip.host
  const community: any = trip.community

  return (
    <div className="max-w-2xl">
      <Link href="/trips" className="text-sm text-secondary hover:text-primary transition-colors">← Trips</Link>

      <div className="flex items-start justify-between gap-4 mt-3 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>
            {new Date(trip.depart_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })} · {trip.depart_time}
          </h1>
          {community && (
            <Link href={`/communities/${community.id}`} className="text-sm text-secondary hover:underline mt-0.5 inline-block">{community.name}</Link>
          )}
        </div>
        <span className={`chip capitalize ${STATUS_STYLE[trip.status] ?? 'bg-neutral text-secondary'}`}>{trip.status}</span>
      </div>

      <dl className="card text-sm grid grid-cols-[7rem_1fr] gap-y-2 mb-8">
        <dt className="text-secondary">Host</dt>
        <dd>{host ? <Link href={`/users/${host.id}`} className="hover:underline">{name(host)}</Link> : '—'}</dd>
        <dt className="text-secondary">Pickup</dt>
        <dd>{trip.pickup_point}{trip.pickup_note ? ` — ${trip.pickup_note}` : ''}</dd>
        <dt className="text-secondary">Vehicle</dt>
        <dd>{[trip.color, trip.vehicle].filter(Boolean).join(' ') || '—'}</dd>
        <dt className="text-secondary">Seats</dt>
        <dd>{trip.seats_open} of {trip.seats_total} open</dd>
        <dt className="text-secondary">Posted</dt>
        <dd>{new Date(trip.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
      </dl>

      <h2 className="text-sm font-medium mb-3">Join requests</h2>
      <div className="card p-0 overflow-hidden">
        {requests && requests.length > 0 ? (
          <ul className="divide-y divide-border">
            {requests.map((r: any) => (
              <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <Link href={`/users/${r.rider?.id}`} className="font-medium hover:underline">{name(r.rider)}</Link>
                <span className={`chip capitalize ${REQ_STYLE[r.status] ?? 'bg-neutral text-secondary'}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary text-center py-8">No requests on this trip.</p>
        )}
      </div>
    </div>
  )
}
