import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function toggleSuspend(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const id = String(formData.get('id') ?? '')
  const suspend = String(formData.get('suspend') ?? '') === 'true'
  if (!id) return

  const { error } = await supabaseAdmin().from('profiles').update({ suspended: suspend }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/users')
}

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim()

  let query = supabaseAdmin()
    .from('profiles')
    .select('id, first_name, last_name, phone, rides_completed, suspended, created_at')
    .order('created_at', { ascending: false })

  if (q) {
    // Inside .or() the ilike wildcard is *, not % (PostgREST syntax).
    const like = `*${q}*`
    query = query.or(`first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`)
  }

  const { data: users } = await query

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.96px' }}>Users</h1>
          <p className="text-sm text-secondary mt-1">Members across all communities. Suspend to block access.</p>
        </div>
        <form className="flex items-center gap-2">
          <input name="q" defaultValue={q} placeholder="Search name or phone…" className="field !w-64" />
          <button className="btn-secondary">Search</button>
          {q && <Link href="/users" className="text-sm text-secondary hover:text-primary">Clear</Link>}
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-secondary">
              <th className="font-medium px-4 py-3">Name</th>
              <th className="font-medium px-4 py-3">Phone</th>
              <th className="font-medium px-4 py-3">Rides</th>
              <th className="font-medium px-4 py-3">Status</th>
              <th className="font-medium px-4 py-3">Joined</th>
              <th className="font-medium px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map(u => {
              const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || '-'
              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-subtle/60">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/users/${u.id}`} className="hover:underline">{name}</Link>
                  </td>
                  <td className="px-4 py-3 text-secondary">{u.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-secondary">{u.rides_completed}</td>
                  <td className="px-4 py-3">
                    {u.suspended
                      ? <span className="chip bg-red-50 text-red-600">Suspended</span>
                      : <span className="chip bg-green-50 text-green-600">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-secondary">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleSuspend}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="suspend" value={String(!u.suspended)} />
                      <button
                        type="submit"
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                          u.suspended
                            ? 'bg-neutral text-primary hover:bg-subtle'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {u.suspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-secondary">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
