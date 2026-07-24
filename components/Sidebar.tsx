'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/communities', label: 'Communities' },
  { href: '/users', label: 'Users' },
  { href: '/trips', label: 'Trips' },
  { href: '/ride-wants', label: 'Ride wants' },
  { href: '/reports', label: 'Reports' },
  { href: '/feedback', label: 'Trip feedback' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/posts', label: 'Blog' },
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
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/veesaa-logo-black.svg" alt="Veesaa" className="h-[16px] w-auto" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.10em] text-secondary">Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center border-l-2 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                active
                  ? 'border-primary bg-subtle text-primary'
                  : 'border-transparent text-secondary hover:bg-subtle/60 hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="truncate text-xs text-secondary">{email}</p>
        <button
          onClick={signOut}
          className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.10em] text-secondary transition-colors hover:text-error"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
