import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Pagination from '@/components/Pagination'
import { PageHeader, Toolbar } from '@/components/ui'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 25

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  active: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  suspended: 'bg-neutral text-secondary',
}

export default async function CommunitiesPage({ searchParams }: { searchParams: { page?: string; filter?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const pendingOnly = searchParams.filter === 'pending'
  const fromRow = (page - 1) * PAGE_SIZE

  let q = supabaseAdmin()
    .from('communities')
    .select('id, code, name, area, logo_url, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (pendingOnly) q = q.eq('status', 'pending')
  const { data: communities, count } = await q.range(fromRow, fromRow + PAGE_SIZE - 1)

  const { count: pendingCount } = await supabaseAdmin()
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div>
      <PageHeader
        title="Communities"
        sub="Codes members use to offer and find rides."
        right={<Link href="/communities/new" className="btn-primary">New community</Link>}
      />

      <Toolbar>
        <Link href="/communities" className={`filter-pill ${pendingOnly ? 'bg-neutral text-secondary hover:bg-subtle' : 'bg-primary text-white'}`}>All</Link>
        <Link href="/communities?filter=pending" className={`filter-pill ${pendingOnly ? 'bg-primary text-white' : 'bg-neutral text-secondary hover:bg-subtle'}`}>
          Pending{(pendingCount ?? 0) > 0 ? ` · ${pendingCount}` : ''}
        </Link>
      </Toolbar>

      <div className="sheet-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-secondary">
              <th className="font-medium px-4 py-3 w-px">Logo</th>
              <th className="font-medium px-4 py-3">Code</th>
              <th className="font-medium px-4 py-3">Name</th>
              <th className="font-medium px-4 py-3">Area</th>
              <th className="font-medium px-4 py-3">Status</th>
              <th className="font-medium px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {communities && communities.length > 0 ? communities.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-subtle/60">
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-md overflow-hidden bg-white border border-border flex items-center justify-center shrink-0">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                      : <span className="text-xs font-semibold text-secondary">{c.name?.[0]?.toUpperCase() ?? 'C'}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-medium">{c.code}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/communities/${c.id}`} className="hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-secondary">{c.area ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`chip capitalize ${STATUS_STYLE[c.status] ?? 'bg-neutral text-secondary'}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-secondary">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-secondary">{pendingOnly ? 'Nothing waiting for review.' : 'No communities yet. Create the first one.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/communities" />
    </div>
  )
}
