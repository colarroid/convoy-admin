import Link from 'next/link'
import PostForm from '../PostForm'
import { createPost } from '../actions'

export default function NewPostPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/posts" className="text-sm text-secondary hover:text-primary transition-colors">← Blog</Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-1" style={{ letterSpacing: '-0.96px' }}>New post</h1>
      <p className="text-sm text-secondary mb-8">Save it as a draft to keep working, or publish it straight away.</p>

      <PostForm action={createPost} />
    </div>
  )
}
