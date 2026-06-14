import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { categoryLabel } from '@/lib/reportCategories'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function count(table: string, build?: (q: any) => any) {
  let q = supabaseAdmin().from(table).select('id', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count } = await q
  return count ?? 0
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="card hover:border-primary/30 transition-colors">
      <p className="text-sm text-secondary">{label}</p>
      <p className="text-3xl font-semibold tracking-tight mt-1">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default async function OverviewPage() {
  const [users, communities, openTrips, pendingReq, openReports] = await Promise.all([
    count('profiles'),
    count('communities'),
    count('trips', (q) => q.in('status', ['open', 'full'])),
    count('join_requests', (q) => q.eq('status', 'pending')),
    count('reports', (q) => q.eq('status', 'open')),
  ])

  const { data: recentReports } = await supabaseAdmin()
    .from('reports')
    .select('id, category, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ letterSpacing: '-0.96px' }}>Overview</h1>
      <p className="text-sm text-secondary mb-8">A snapshot of the platform.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <Stat label="Users" value={users} href="/users" />
        <Stat label="Communities" value={communities} href="/communities" />
        <Stat label="Active rides" value={openTrips} href="/trips" />
        <Stat label="Pending requests" value={pendingReq} href="/trips" />
        <Stat label="Open reports" value={openReports} href="/reports" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium">Open reports</p>
          <Link href="/reports" className="text-sm text-tertiary hover:underline">View all</Link>
        </div>
        {recentReports && recentReports.length > 0 ? (
          <ul className="divide-y divide-border">
            {recentReports.map(r => (
              <li key={r.id}>
                <Link href="/reports?status=open" className="py-2.5 flex items-center justify-between hover:text-tertiary transition-colors">
                  <span className="text-sm">{categoryLabel(r.category)}</span>
                  <span className="text-xs text-secondary">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary py-2">No open reports. 🎉</p>
        )}
      </div>
    </div>
  )
}
