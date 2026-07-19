import { supabaseAdmin } from '@/lib/supabase/admin'
import Pagination from '@/components/Pagination'
import { PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'
const initial = (p: any) => (p?.first_name?.[0] ?? p?.last_name?.[0] ?? '?').toUpperCase()

export default async function FeedbackPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const fromRow = (page - 1) * PAGE_SIZE
  const { data: items, count } = await supabaseAdmin()
    .from('trip_feedback')
    .select(`
      id, reason, created_at,
      host:profiles!trip_feedback_host_id_fkey ( first_name, last_name ),
      trip:trips (
        depart_date, depart_time, pickup_point,
        community:communities ( name ),
        join_requests ( status, rider:profiles!join_requests_rider_id_fkey ( first_name, last_name, photo_url ) )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1)

  return (
    <div>
      <PageHeader title="Trip feedback" sub="Reasons hosts gave when cancelling a ride, or when a trip didn't happen, and who was on board." />

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((f: any) => {
            const approved = (f.trip?.join_requests ?? []).filter((j: any) => j.status === 'approved')
            return (
              <div key={f.id} className="card">
                <p className="text-sm text-primary whitespace-pre-wrap">
                  {f.reason ? f.reason : <span className="text-secondary italic">No note left</span>}
                </p>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-secondary">
                    {approved.length > 0 ? `Passengers on board (${approved.length})` : 'No approved passengers'}
                  </p>
                  {approved.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {approved.map((j: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-neutral py-1 pl-1 pr-3 text-xs text-primary">
                          <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-secondary">
                            {j.rider?.photo_url
                              ? <img src={j.rider.photo_url} alt="" className="h-full w-full object-cover" />
                              : initial(j.rider)}
                          </span>
                          {name(j.rider)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-secondary">
                  <span>Host: <span className="text-primary">{name(f.host)}</span></span>
                  {f.trip?.community?.name && <span>· {f.trip.community.name}</span>}
                  {f.trip?.depart_date && (
                    <span>· ride {new Date(f.trip.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{f.trip.depart_time ? `, ${f.trip.depart_time}` : ''}</span>
                  )}
                  <span className="ml-auto">{new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">No feedback yet.</p>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/feedback" />
    </div>
  )
}
