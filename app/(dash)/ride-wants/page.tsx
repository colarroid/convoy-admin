import { supabaseAdmin } from '@/lib/supabase/admin'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

/**
 * Demand signal. Every ride search a member runs, with how many results it
 * returned. Rows with 0 results are unmet demand: someone wanted a ride in that
 * community and there was nothing there. That is the strongest signal we have
 * for where to recruit hosts, and it cannot be reconstructed after the fact.
 */
export default async function RideWantsPage({
  searchParams,
}: {
  searchParams: { page?: string; filter?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const unmetOnly = searchParams.filter !== 'all'
  const fromRow = (page - 1) * PAGE_SIZE

  let q = supabaseAdmin()
    .from('ride_wants')
    .select(
      'id, code, starting_place, results_count, wants_notify, status, created_at, community:communities ( name ), rider:profiles ( first_name, last_name )',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
  if (unmetOnly) q = q.eq('results_count', 0)

  const { data: items, count } = await q.range(fromRow, fromRow + PAGE_SIZE - 1)

  // Headline: how much demand went unmet.
  const { count: totalAll } = await supabaseAdmin()
    .from('ride_wants')
    .select('id', { count: 'exact', head: true })
  const { count: totalUnmet } = await supabaseAdmin()
    .from('ride_wants')
    .select('id', { count: 'exact', head: true })
    .eq('results_count', 0)
  const unmetPct = totalAll ? Math.round(((totalUnmet ?? 0) / totalAll) * 100) : 0

  const base = `/ride-wants${unmetOnly ? '' : '?filter=all'}`

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>
          Ride wants
        </h1>
        <p className="text-sm text-secondary mt-1">
          Every ride search, and what it returned. Searches with no results are unmet demand:
          the clearest signal of where a community needs hosts.
        </p>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="text-xs text-secondary">Searches</p>
          <p className="text-xl font-semibold text-primary">{totalAll ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Unmet</p>
          <p className="text-xl font-semibold text-primary">{totalUnmet ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Unmet rate</p>
          <p className="text-xl font-semibold text-primary">{unmetPct}%</p>
        </div>
        <div className="ml-auto flex gap-2">
          <a href="/ride-wants" className={`btn-secondary ${unmetOnly ? 'font-semibold' : ''}`}>Unmet only</a>
          <a href="/ride-wants?filter=all" className={`btn-secondary ${unmetOnly ? '' : 'font-semibold'}`}>All</a>
        </div>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((w: any) => {
            const rider = [w.rider?.first_name, w.rider?.last_name].filter(Boolean).join(' ')
            return (
              <div key={w.id} className="card">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-primary">{w.community?.name ?? w.code}</span>
                  <span className="text-sm text-secondary">{rider || 'Member'}</span>
                  {w.results_count === 0 ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                      No rides found
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      {w.results_count} shown
                    </span>
                  )}
                  {w.wants_notify && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                      Wants notifying
                    </span>
                  )}
                  {w.status === 'fulfilled' && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                      Notified
                    </span>
                  )}
                  <span className="ml-auto text-xs text-secondary">
                    {new Date(w.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {w.starting_place && (
                  <p className="mt-2 text-sm text-secondary">From: {w.starting_place}</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">
            {unmetOnly ? 'No unmet searches yet. Good news.' : 'No ride searches recorded yet.'}
          </p>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath={base} />
    </div>
  )
}
