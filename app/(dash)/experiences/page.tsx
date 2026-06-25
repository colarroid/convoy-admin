import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'

const MAX_PINNED = 7
const PAGE_SIZE = 25

const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'

async function setPinned(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')
  const id = String(formData.get('id') ?? '')
  const pin = String(formData.get('pin') ?? '') === '1'
  if (!id) return

  if (pin) {
    const { count } = await supabaseAdmin()
      .from('experiences')
      .select('id', { count: 'exact', head: true })
      .eq('pinned', true)
    if ((count ?? 0) >= MAX_PINNED) {
      throw new Error(`You can pin at most ${MAX_PINNED} experiences. Unpin one first.`)
    }
  }
  await supabaseAdmin().from('experiences').update({ pinned: pin }).eq('id', id)
  revalidatePath('/experiences')
}

async function setVisible(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')
  const id = String(formData.get('id') ?? '')
  const vis = String(formData.get('vis') ?? '') === '1'
  if (!id) return
  // Hiding also unpins so a hidden item can't sit in the landing slots.
  await supabaseAdmin().from('experiences').update({ visible: vis, pinned: vis ? undefined : false }).eq('id', id)
  revalidatePath('/experiences')
}

export default async function ExperiencesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const fromRow = (page - 1) * PAGE_SIZE

  const { data: items, count } = await supabaseAdmin()
    .from('experiences')
    .select('id, body, pinned, visible, created_at, author:profiles!experiences_user_id_fkey ( first_name, last_name )', { count: 'exact' })
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1)

  // Count all pinned (not just this page) for the cap indicator.
  const { count: pinnedCount } = await supabaseAdmin()
    .from('experiences')
    .select('id', { count: 'exact', head: true })
    .eq('pinned', true)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Experiences</h1>
        <p className="text-sm text-secondary mt-1">
          Member testimonials. Pin up to {MAX_PINNED} to feature on the landing page ({pinnedCount ?? 0}/{MAX_PINNED} pinned). Hide anything off-brand.
        </p>
      </div>

      {items && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((e: any) => (
            <div key={e.id} className={`card ${e.visible ? '' : 'opacity-60'}`}>
              <p className="text-sm text-primary whitespace-pre-wrap">{e.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-xs text-secondary">
                <span className="font-medium text-primary">{name(e.author)}</span>
                {e.pinned && <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-600">Pinned</span>}
                {!e.visible && <span className="rounded-full bg-neutral px-2 py-0.5 font-semibold text-secondary">Hidden</span>}
                <span>{new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>

                <span className="ml-auto flex items-center gap-2">
                  {e.visible && (
                    <form action={setPinned}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="pin" value={e.pinned ? '0' : '1'} />
                      <button className="rounded-full px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                        {e.pinned ? 'Unpin' : 'Pin'}
                      </button>
                    </form>
                  )}
                  <form action={setVisible}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="vis" value={e.visible ? '0' : '1'} />
                    <button className="rounded-full px-3 py-1.5 font-medium text-secondary hover:text-primary hover:bg-subtle transition-colors">
                      {e.visible ? 'Hide' : 'Unhide'}
                    </button>
                  </form>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-secondary">No experiences shared yet.</p>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/experiences" />
    </div>
  )
}
