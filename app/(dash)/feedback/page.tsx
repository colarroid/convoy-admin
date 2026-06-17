import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'

export default async function FeedbackPage() {
  const { data: items } = await supabaseAdmin()
    .from('trip_feedback')
    .select(`
      id, reason, created_at,
      host:profiles!trip_feedback_host_id_fkey ( first_name, last_name ),
      trip:trips ( depart_date, community:communities ( name ) )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Trip feedback</h1>
        <p className="text-sm text-secondary mt-1">Why trips didn&apos;t happen — notes hosts left when cancelling a past ride.</p>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((f: any) => (
            <div key={f.id} className="card">
              <p className="text-sm text-primary whitespace-pre-wrap">
                {f.reason ? f.reason : <span className="text-secondary italic">No note left</span>}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-border text-xs text-secondary">
                <span>{name(f.host)}</span>
                {f.trip?.community?.name && <span>· {f.trip.community.name}</span>}
                {f.trip?.depart_date && (
                  <span>· ride {new Date(f.trip.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                )}
                <span className="ml-auto">{new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">No feedback yet.</p>
        </div>
      )}
    </div>
  )
}
