import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function CommunitiesPage() {
  const { data: communities } = await supabaseAdmin()
    .from('communities')
    .select('id, code, name, area, logo_url, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Communities</h1>
          <p className="text-sm text-secondary mt-1">Codes members use to offer and find rides.</p>
        </div>
        <Link href="/communities/new" className="btn-primary">New community</Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-secondary">
              <th className="font-medium px-4 py-3 w-px">Logo</th>
              <th className="font-medium px-4 py-3">Code</th>
              <th className="font-medium px-4 py-3">Name</th>
              <th className="font-medium px-4 py-3">Area</th>
              <th className="font-medium px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {communities && communities.length > 0 ? communities.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-subtle/60">
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-md overflow-hidden bg-neutral border border-border flex items-center justify-center shrink-0">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-semibold text-secondary">{c.name?.[0]?.toUpperCase() ?? 'C'}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-medium">{c.code}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/communities/${c.id}`} className="hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-secondary">{c.area ?? '-'}</td>
                <td className="px-4 py-3 text-secondary">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-secondary">No communities yet. Create the first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
