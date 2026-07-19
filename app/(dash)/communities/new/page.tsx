import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import LogoUpload from '@/components/LogoUpload'
import CommunityLocationFields from '@/components/CommunityLocationFields'

async function createCommunity(formData: FormData) {
  'use server'
  const admin = await getAdminUser()
  if (!admin) redirect('/login')

  const code = String(formData.get('code') ?? '').trim().toUpperCase()
  const name = String(formData.get('name') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const area = String(formData.get('area') ?? '').trim()
  const country = String(formData.get('country') ?? '').trim().toUpperCase()
  const logo_url = String(formData.get('logo_url') ?? '').trim()

  if (!code || !name) return

  const { error } = await supabaseAdmin().from('communities').insert({
    code, name,
    address: address || null,
    area: area || null,
    country: country || null,
    logo_url: logo_url || null,
  })

  if (error) throw new Error(`Could not create community: ${error.message}`)

  redirect('/communities')
}

export default function NewCommunityPage() {
  return (
    <div className="max-w-lg">
      <Link href="/communities" className="text-sm text-secondary hover:text-primary transition-colors">← Communities</Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-1" style={{ letterSpacing: '-0.96px' }}>New community</h1>
      <p className="text-sm text-secondary mb-8">Members enter the code to access this community&apos;s rides.</p>

      <form action={createCommunity} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Community code</label>
          <input name="code" placeholder="e.g. RIVERSIDE-01" required className="field uppercase font-mono" />
          <p className="text-xs text-secondary mt-1.5">Short, memorable, unique. Shared with members.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input name="name" placeholder="e.g. Riverside Community" required className="field" />
        </div>

        <CommunityLocationFields />

        <div>
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <select name="country" className="field" defaultValue="">
            <option value="">Not set</option>
            <option value="NG">Nigeria</option>
            <option value="CA">Canada</option>
          </select>
          <p className="text-xs text-secondary mt-1.5">Used to group this community on the public Communities page.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Logo</label>
          <LogoUpload />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/communities" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">Create community</button>
        </div>
      </form>
    </div>
  )
}
