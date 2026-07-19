import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import { categoryLabel } from '@/lib/reportCategories'
import Pagination from '@/components/Pagination'
import { PageHeader, Toolbar } from '@/components/ui'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

async function updateReport(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const admin_notes = String(formData.get('admin_notes') ?? '').trim()
  if (!id || !['open', 'reviewing', 'resolved'].includes(status)) return

  const { error } = await supabaseAdmin()
    .from('reports')
    .update({ status, admin_notes: admin_notes || null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/reports')
  revalidatePath('/')
}

async function suspendReported(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const userId = String(formData.get('user_id') ?? '')
  if (!userId) return

  const { error } = await supabaseAdmin().from('profiles').update({ suspended: true }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/reports')
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-red-50 text-red-600',
  reviewing: 'bg-amber-50 text-amber-600',
  resolved: 'bg-green-50 text-green-600',
}

const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'

const STATUSES = ['open', 'reviewing', 'resolved'] as const

export default async function ReportsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const status = STATUSES.includes(searchParams.status as any) ? searchParams.status : ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const fromRow = (page - 1) * PAGE_SIZE

  let query = supabaseAdmin()
    .from('reports')
    .select(`
      id, category, details, status, admin_notes, created_at,
      reporter:profiles!reports_reporter_id_fkey ( first_name, last_name ),
      reported:profiles!reports_reported_user_id_fkey ( id, first_name, last_name, suspended ),
      trip:trips ( pickup_point, depart_date, community:communities ( name, code ) )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data: reports, count } = await query

  return (
    <div>
      <PageHeader title="Reports" sub="Safety reports filed by members. Review and take action." />

      <Toolbar>
        <Link href="/reports" className={`chip ${!status ? 'bg-primary text-white' : 'bg-neutral text-secondary hover:bg-subtle'}`}>All</Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/reports?status=${s}`} className={`chip capitalize ${status === s ? 'bg-primary text-white' : 'bg-neutral text-secondary hover:bg-subtle'}`}>{s}</Link>
        ))}
      </Toolbar>

      {reports && reports.length > 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          {reports.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium">{categoryLabel(r.category)}</p>
                  <p className="text-xs text-secondary mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`chip capitalize ${STATUS_STYLE[r.status] ?? 'bg-neutral text-secondary'}`}>{r.status}</span>
              </div>

              <dl className="text-sm grid grid-cols-[7rem_1fr] gap-y-1.5 mb-4">
                <dt className="text-secondary">Reporter</dt>
                <dd>{name(r.reporter)}</dd>
                <dt className="text-secondary">Reported</dt>
                <dd className="flex items-center gap-2">
                  {r.reported ? name(r.reported) : '-'}
                  {r.reported?.suspended && <span className="chip bg-red-50 text-red-600">Suspended</span>}
                </dd>
                {r.trip?.community && (
                  <>
                    <dt className="text-secondary">Community</dt>
                    <dd>{r.trip.community.name} <span className="text-secondary font-mono text-xs">({r.trip.community.code})</span></dd>
                  </>
                )}
                {r.trip && (
                  <>
                    <dt className="text-secondary">Trip</dt>
                    <dd className="text-secondary">Pickup: {r.trip.pickup_point} · {new Date(r.trip.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</dd>
                  </>
                )}
                {r.details && (
                  <>
                    <dt className="text-secondary">Details</dt>
                    <dd className="whitespace-pre-wrap">{r.details}</dd>
                  </>
                )}
              </dl>

              <form action={updateReport} className="border-t border-border pt-4 flex flex-col gap-3">
                <input type="hidden" name="id" value={r.id} />
                <textarea
                  name="admin_notes"
                  defaultValue={r.admin_notes ?? ''}
                  placeholder="Reviewer notes (optional)…"
                  rows={2}
                  className="field-area"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button name="status" value="reviewing" className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral text-primary hover:bg-subtle transition-colors">
                    Mark reviewing
                  </button>
                  <button name="status" value="resolved" className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                    Resolve
                  </button>
                  <button name="status" value="open" className="text-xs font-medium px-3 py-1.5 rounded-full text-secondary hover:bg-subtle transition-colors">
                    Reopen
                  </button>
                </div>
              </form>

              {r.reported && !r.reported.suspended && (
                <form action={suspendReported} className="mt-2">
                  <input type="hidden" name="user_id" value={r.reported.id} />
                  <button className="text-xs font-medium px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors">
                    Suspend reported user
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card mt-8 text-center py-12">
          <p className="text-sm text-secondary">{status ? `No ${status} reports.` : 'No reports filed. 🎉'}</p>
        </div>
      )}

      <div className="mt-8">
        <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/reports" params={{ status }} />
      </div>
    </div>
  )
}
