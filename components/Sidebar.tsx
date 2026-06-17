'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/communities', label: 'Communities' },
  { href: '/users', label: 'Users' },
  { href: '/trips', label: 'Trips' },
  { href: '/reports', label: 'Reports' },
  { href: '/feedback', label: 'Trip feedback' },
  { href: '/broadcasts', label: 'Broadcasts' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const signOut = async () => {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center border-b border-border">
        <span className="text-base font-semibold tracking-tight">Veesaa</span>
        <span className="ml-2 text-xs text-secondary">Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              isActive(item.href) ? 'bg-subtle text-primary font-medium' : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <p className="px-3 text-xs text-secondary truncate mb-2">{email}</p>
        <button onClick={signOut} className="w-full text-left px-3 py-2 rounded-md text-sm text-secondary hover:text-error hover:bg-subtle transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  )
}
