import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import PostForm from '../../PostForm'
import { updatePost, deletePost } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const { data: post } = await supabaseAdmin()
    .from('posts')
    .select('id, slug, title, excerpt, meta_description, body_md, cover_url, category, author_name, status, published_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!post) notFound()

  const save = updatePost.bind(null, post.id)
  const remove = deletePost.bind(null, post.id)

  return (
    <div className="max-w-2xl">
      <Link href="/posts" className="text-sm text-secondary hover:text-primary transition-colors">← Blog</Link>

      <div className="mt-3 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Edit post</h1>
          <p className="text-sm text-secondary mt-1">
            <span className={`chip capitalize ${post.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
              {post.status}
            </span>
            {post.status === 'published' && (
              <>
                {' '}
                <a
                  href={`https://www.veesaa.co/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 hover:text-primary"
                >
                  View on the site
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <PostForm action={save} post={post} />

      <form action={remove} className="mt-10 border-t border-border pt-6">
        <button className="btn-secondary text-red-600">Delete post</button>
        <p className="text-xs text-secondary mt-2">Permanent. If the post is published, its URL will start returning 404.</p>
      </form>
    </div>
  )
}
