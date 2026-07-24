'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoUpload from '@/components/LogoUpload'
import { slugify } from '@/lib/slug'

export interface PostFormValues {
  id?: string
  slug?: string
  title?: string
  excerpt?: string | null
  body_md?: string
  cover_url?: string | null
  category?: string | null
  author_name?: string | null
  status?: string
}

/**
 * Create/edit form for a post. Submits to a server action; the two submit
 * buttons differ only by the `publish` flag, so saving a draft and publishing
 * go through exactly the same validation and write path.
 */
export default function PostForm({
  action,
  post = {},
  cancelHref = '/posts',
}: {
  action: (formData: FormData) => void
  post?: PostFormValues
  cancelHref?: string
}) {
  const [title, setTitle] = useState(post.title ?? '')
  const [slug, setSlug] = useState(post.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(post.slug))

  // Until the slug is edited by hand, keep it in step with the title.
  const effectiveSlug = slugTouched ? slug : slugify(title)

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Title</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Riverside House is now sharing rides"
          className="field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Slug</label>
        <input
          name="slug"
          value={effectiveSlug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
          placeholder="riverside-house-is-now-sharing-rides"
          className="field font-mono text-xs"
        />
        <p className="text-xs text-secondary mt-1.5">
          The URL: veesaa.co/blog/<span className="font-mono">{effectiveSlug || 'your-post'}</span>. Changing it on a
          published post breaks existing links.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <input name="category" defaultValue={post.category ?? ''} placeholder="e.g. Product" className="field" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">Author</label>
          <input name="author_name" defaultValue={post.author_name ?? 'Veesaa'} placeholder="Veesaa" className="field" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Excerpt</label>
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={post.excerpt ?? ''}
          placeholder="One or two sentences. Used on cards and as the search description."
          className="field-area"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Cover image</label>
        <LogoUpload
          name="cover_url"
          defaultUrl={post.cover_url ?? ''}
          wide
          hint="Wide image, around 1200x630. Shown on cards and when the post is shared."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Body</label>
        <textarea
          name="body_md"
          rows={20}
          defaultValue={post.body_md ?? ''}
          placeholder={'Markdown. ## for a heading, **bold**, [link](https://…), - for a list.'}
          className="field-area font-mono text-[13px] leading-relaxed"
        />
        <p className="text-xs text-secondary mt-1.5">
          Markdown: <span className="font-mono">##</span> heading,{' '}
          <span className="font-mono">**bold**</span>, <span className="font-mono">- item</span>,{' '}
          <span className="font-mono">[text](url)</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link href={cancelHref} className="btn-secondary">Cancel</Link>
        <button type="submit" name="publish" value="0" className="btn-secondary">Save as draft</button>
        <button type="submit" name="publish" value="1" className="btn-primary">
          {post.status === 'published' ? 'Save and keep published' : 'Publish'}
        </button>
      </div>
    </form>
  )
}
