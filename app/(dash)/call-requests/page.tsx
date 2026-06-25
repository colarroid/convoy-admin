import { supabaseAdmin } from '@/lib/supabase/admin'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

export default async function CallRequestsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const fromRow = (page - 1) * PAGE_SIZE
  const { data: items, count } = await supabaseAdmin()
    .from('call_requests')
    .select('id, name, email, community, is_admin, note, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Call requests</h1>
        <p className="text-sm text-secondary mt-1">People asking to schedule a call about bringing Veesaa to their community.</p>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-primary">{c.name || 'No name'}</span>
                <span className="text-sm text-secondary">{c.email}</span>
                {c.community && <span className="text-sm text-secondary">· {c.community}</span>}
                {c.is_admin && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">Community admin / owner</span>
                )}
                <span className="ml-auto text-xs text-secondary">
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {c.note && <p className="mt-2 text-sm text-primary whitespace-pre-wrap">{c.note}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">No call requests yet.</p>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/call-requests" />
    </div>
  )
}
