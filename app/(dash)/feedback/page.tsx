import { supabaseAdmin } from '@/lib/supabase/admin'
import Pagination from '@/components/Pagination'
import { PageHeader } from '@/components/ui'
import FeedbackList from './FeedbackList'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

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
        <FeedbackList items={items} />
      ) : (
        <div className="card mt-8 text-center py-12">
          <p className="text-sm text-secondary">No feedback yet.</p>
        </div>
      )}

      <div className="mt-8">
        <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/feedback" />
      </div>
    </div>
  )
}
