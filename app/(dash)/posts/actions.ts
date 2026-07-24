'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import { slugify } from '@/lib/slug'

function readForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim()
  return {
    title,
    slug: slugify(rawSlug || title),
    excerpt: String(formData.get('excerpt') ?? '').trim() || null,
    meta_description: String(formData.get('meta_description') ?? '').trim() || null,
    body_md: String(formData.get('body_md') ?? ''),
    cover_url: String(formData.get('cover_url') ?? '').trim() || null,
    category: String(formData.get('category') ?? '').trim() || null,
    author_name: String(formData.get('author_name') ?? '').trim() || null,
    publish: String(formData.get('publish') ?? '') === '1',
  }
}

export async function createPost(formData: FormData) {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const f = readForm(formData)
  if (!f.title || !f.slug) return

  const { data, error } = await supabaseAdmin()
    .from('posts')
    .insert({
      slug: f.slug,
      title: f.title,
      excerpt: f.excerpt,
      meta_description: f.meta_description,
      body_md: f.body_md,
      cover_url: f.cover_url,
      category: f.category,
      author_name: f.author_name,
      status: f.publish ? 'published' : 'draft',
      published_at: f.publish ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Could not create the post: ${error.message}`)

  revalidatePath('/posts')
  redirect(`/posts/${data.id}/edit`)
}

export async function updatePost(id: string, formData: FormData) {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const f = readForm(formData)
  if (!id || !f.title || !f.slug) return

  // Publishing stamps published_at once and keeps it on later edits, so the
  // original publication date is not rewritten every time the post is touched.
  const { data: existing } = await supabaseAdmin()
    .from('posts').select('published_at').eq('id', id).maybeSingle()

  const { error } = await supabaseAdmin()
    .from('posts')
    .update({
      slug: f.slug,
      title: f.title,
      excerpt: f.excerpt,
      meta_description: f.meta_description,
      body_md: f.body_md,
      cover_url: f.cover_url,
      category: f.category,
      author_name: f.author_name,
      status: f.publish ? 'published' : 'draft',
      published_at: f.publish ? (existing?.published_at ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`Could not save the post: ${error.message}`)

  revalidatePath('/posts')
  revalidatePath(`/posts/${id}/edit`)
  redirect('/posts')
}

export async function deletePost(id: string) {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')
  const { error } = await supabaseAdmin().from('posts').delete().eq('id', id)
  if (error) throw new Error(`Could not delete the post: ${error.message}`)
  revalidatePath('/posts')
  redirect('/posts')
}
