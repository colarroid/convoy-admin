import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { categoryLabel } from '@/lib/reportCategories'
import { PageHeader, Band, BandCell, SectionStrip } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function count(table: string, build?: (q: any) => any) {
  let q = supabaseAdmin().from(table).select('id', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count } = await q
  return count ?? 0
}

export default async function OverviewPage() {
  const [users, communities, pendingComms, openTrips, pendingReq, openReports] = await Promise.all([
    count('profiles'),
    count('communities'),
    count('communities', (q) => q.eq('status', 'pending')),
    // Active = open/full and still upcoming. Past unconfirmed trips are
    // "awaiting confirmation", not active.
    count('trips', (q) => q.in('status', ['open', 'full']).gte('departs_at', new Date().toISOString())),
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
      <PageHeader title="Overview" sub="A snapshot of the platform." />

      <Band className="lg:grid-cols-3">
        <BandCell label="Users" value={users} href="/users" />
        <BandCell label="Communities" value={communities} href="/communities" />
        <BandCell label="Pending review" value={pendingComms} href="/communities?filter=pending" />
        <BandCell label="Active rides" value={openTrips} href="/trips" />
        <BandCell label="Pending requests" value={pendingReq} href="/trips" />
        <BandCell label="Open reports" value={openReports} href="/reports" />
      </Band>

      <SectionStrip
        title="Open reports"
        right={<Link href="/reports?status=open" className="font-mono text-[10px] font-semibold uppercase tracking-[0.10em] text-secondary transition-colors hover:text-primary">View all</Link>}
      />
      {recentReports && recentReports.length > 0 ? (
        <ul className="-mx-7 border-b border-border">
          {recentReports.map(r => (
            <li key={r.id} className="border-b border-border last:border-0">
              <Link href="/reports?status=open" className="flex items-center justify-between px-7 py-4 transition-colors hover:bg-subtle/40">
                <span className="text-sm text-primary">{categoryLabel(r.category)}</span>
                <span className="font-mono text-xs text-secondary">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="-mx-7 border-b border-border px-7 py-10 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.10em] text-secondary">No open reports</p>
        </div>
      )}
    </div>
  )
}
