import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function WaitlistPage() {
  const { data: items } = await supabaseAdmin()
    .from('waitlist')
    .select('id, community, email, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Waitlist</h1>
        <p className="text-sm text-secondary mt-1">People asking us to bring Veesaa to their community.</p>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((w: any) => (
            <div key={w.id} className="card">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-primary">{w.email}</span>
                {w.community && <span className="text-sm text-secondary">· {w.community}</span>}
                <span className="ml-auto text-xs text-secondary">
                  {new Date(w.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">No waitlist signups yet.</p>
        </div>
      )}
    </div>
  )
}
