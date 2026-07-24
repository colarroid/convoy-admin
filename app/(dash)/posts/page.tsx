import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  draft: 'bg-amber-50 text-amber-600',
}

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function PostsPage() {
  const { data: posts } = await supabaseAdmin()
    .from('posts')
    .select('id, slug, title, category, status, published_at, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Blog"
        sub="Posts on veesaa.co/blog. Drafts stay private until you publish them."
        right={<Link href="/posts/new" className="btn-primary">New post</Link>}
      />

      {posts && posts.length > 0 ? (
        <div className="sheet-panel">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th className="text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p: any) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/posts/${p.id}/edit`} className="font-medium hover:underline">{p.title}</Link>
                    <p className="mt-0.5 font-mono text-xs text-secondary">/blog/{p.slug}</p>
                  </td>
                  <td className="text-secondary">{p.category ?? '-'}</td>
                  <td>
                    <span className={`chip capitalize ${STATUS_STYLE[p.status] ?? 'bg-neutral text-secondary'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-secondary">{p.published_at ? shortDate(p.published_at) : '-'}</td>
                  <td className="text-right text-secondary">{shortDate(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-8 text-center py-12">
          <p className="text-sm text-secondary">No posts yet.</p>
          <Link href="/posts/new" className="btn-primary mt-4 inline-flex">Write the first one</Link>
        </div>
      )}
    </div>
  )
}
