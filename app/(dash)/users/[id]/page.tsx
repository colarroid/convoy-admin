import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import { categoryLabel } from '@/lib/reportCategories'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-50 text-blue-600',
  full: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-neutral text-secondary',
}
const fullName = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '-'

async function toggleSuspend(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')
  const id = String(formData.get('id') ?? '')
  const suspend = String(formData.get('suspend') ?? '') === 'true'
  if (!id) return
  const { error } = await supabaseAdmin().from('profiles').update({ suspended: suspend }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/users/${id}`)
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseAdmin()

  const { data: user } = await db
    .from('profiles')
    .select('id, first_name, last_name, phone, rides_completed, suspended, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!user) notFound()

  const [{ data: hosted }, { data: joined }, { data: reportsAgainst }] = await Promise.all([
    db.from('trips')
      .select('id, depart_date, depart_time, status, community:communities(name)')
      .eq('host_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('join_requests')
      .select('id, status, trip:trips ( id, depart_date, depart_time, status, community:communities(name) )')
      .eq('rider_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('reports')
      .select('id, category, status, created_at')
      .eq('reported_user_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-2xl">
      <Link href="/users" className="text-sm text-secondary hover:text-primary transition-colors">← Users</Link>

      <div className="flex items-start justify-between gap-4 mt-3 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3" style={{ letterSpacing: '-0.96px' }}>
            {fullName(user)}
            {user.suspended && <span className="chip bg-red-50 text-red-600">Suspended</span>}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {user.phone ?? 'No phone'} · {user.rides_completed > 0 ? `${user.rides_completed} rides` : 'No rides yet'} · joined {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <form action={toggleSuspend}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="suspend" value={String(!user.suspended)} />
          <button className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${user.suspended ? 'bg-neutral text-primary hover:bg-subtle' : 'text-red-600 hover:bg-red-50'}`}>
            {user.suspended ? 'Reinstate' : 'Suspend'}
          </button>
        </form>
      </div>

      {reportsAgainst && reportsAgainst.length > 0 && (
        <div className="card mb-6 border-red-200">
          <p className="text-sm font-medium mb-2">Reports against this user ({reportsAgainst.length})</p>
          <ul className="text-sm divide-y divide-border">
            {reportsAgainst.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between">
                <span>{categoryLabel(r.category)}</span>
                <span className="text-xs text-secondary capitalize">{r.status} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="text-sm font-medium mb-3">Rides offered ({hosted?.length ?? 0})</h2>
      <div className="card p-0 overflow-hidden mb-8">
        {hosted && hosted.length > 0 ? (
          <ul className="divide-y divide-border">
            {hosted.map((t: any) => (
              <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <Link href={`/trips/${t.id}`} className="font-medium hover:underline">
                  {new Date(t.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {t.depart_time}
                </Link>
                <span className="text-secondary text-sm flex items-center gap-3">
                  {t.community?.name}
                  <span className={`chip capitalize ${STATUS_STYLE[t.status] ?? 'bg-neutral text-secondary'}`}>{t.status}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-secondary text-center py-8">No rides offered.</p>}
      </div>

      <h2 className="text-sm font-medium mb-3">Rides joined ({joined?.length ?? 0})</h2>
      <div className="card p-0 overflow-hidden">
        {joined && joined.length > 0 ? (
          <ul className="divide-y divide-border">
            {joined.map((j: any) => (
              <li key={j.id} className="px-4 py-3 flex items-center justify-between gap-4">
                {j.trip ? (
                  <Link href={`/trips/${j.trip.id}`} className="font-medium hover:underline">
                    {new Date(j.trip.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {j.trip.depart_time}
                  </Link>
                ) : <span className="text-secondary">Trip removed</span>}
                <span className="text-secondary text-sm flex items-center gap-3">
                  {j.trip?.community?.name}
                  <span className={`chip capitalize ${STATUS_STYLE[j.status] ?? 'bg-neutral text-secondary'}`}>{j.status}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-secondary text-center py-8">No rides joined.</p>}
      </div>
    </div>
  )
}
