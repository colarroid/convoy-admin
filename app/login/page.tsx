'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (signInError || !data.user) {
      setLoading(false)
      setError('Wrong email or password.')
      return
    }

    // Must be an admin.
    const { data: adminRow } = await supabaseBrowser.from('admins').select('id').eq('id', data.user.id).maybeSingle()
    if (!adminRow) {
      await supabaseBrowser.auth.signOut()
      setLoading(false)
      setError('This account does not have admin access.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xl font-semibold tracking-tight">Veesaa</p>
          <p className="text-sm text-secondary mt-1">Admin sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="field" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="field" />
          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {error && <p className="text-xs text-error text-center">{error}</p>}
        </form>
      </div>
    </main>
  )
}
