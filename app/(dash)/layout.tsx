import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-neutral">
      <Sidebar email={user.email ?? ''} />
      <main className="min-w-0 flex-1">
        {/* Rule-framed sheet: panels break out of px-7 to touch the frame. */}
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col border-x border-border bg-surface">
          <div className="flex-1 px-7 py-8">{children}</div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 py-4">
            <p className="text-xs text-secondary">© {new Date().getFullYear()} VZA Technologies Limited</p>
            <p className="text-xs text-secondary">Veesaa Admin</p>
          </footer>
        </div>
      </main>
    </div>
  )
}
