import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ''} />
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
