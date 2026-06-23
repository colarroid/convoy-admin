import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth'
import LogoUpload from '@/components/LogoUpload'
import CommunityLocationFields from '@/components/CommunityLocationFields'

export const dynamic = 'force-dynamic'

export default async function EditCommunityPage({ params }: { params: { id: string } }) {
  const { data: community } = await supabaseAdmin()
    .from('communities')
    .select('id, code, name, address, area, country, logo_url')
    .eq('id', params.id)
    .maybeSingle()

  if (!community) notFound()

  async function updateCommunity(formData: FormData) {
    'use server'
    const admin = await getAdminUser()
    if (!admin) redirect('/login')

    const id = String(formData.get('id') ?? '')
    const code = String(formData.get('code') ?? '').trim().toUpperCase()
    const name = String(formData.get('name') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    const area = String(formData.get('area') ?? '').trim()
    const country = String(formData.get('country') ?? '').trim().toUpperCase()
    const logo_url = String(formData.get('logo_url') ?? '').trim()
    if (!id || !code || !name) return

    const { error } = await supabaseAdmin().from('communities').update({
      code, name,
      address: address || null,
      area: area || null,
      country: country || null,
      logo_url: logo_url || null,
    }).eq('id', id)
    if (error) throw new Error(`Could not update community: ${error.message}`)

    revalidatePath('/communities')
    revalidatePath(`/communities/${id}`)
    redirect(`/communities/${id}`)
  }

  return (
    <div className="max-w-lg">
      <Link href={`/communities/${community.id}`} className="text-sm text-secondary hover:text-primary transition-colors">← {community.name}</Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-8" style={{ letterSpacing: '-0.96px' }}>Edit community</h1>

      <form action={updateCommunity} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={community.id} />

        <div>
          <label className="block text-sm font-medium mb-1.5">Community code</label>
          <input name="code" defaultValue={community.code} required className="field uppercase font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input name="name" defaultValue={community.name} required className="field" />
        </div>

        <CommunityLocationFields defaultAddress={community.address ?? ''} defaultArea={community.area ?? ''} />

        <div>
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <select name="country" className="field" defaultValue={community.country ?? ''}>
            <option value="">Not set</option>
            <option value="NG">Nigeria</option>
            <option value="CA">Canada</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="GH">Ghana</option>
            <option value="KE">Kenya</option>
            <option value="ZA">South Africa</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Logo</label>
          <LogoUpload defaultUrl={community.logo_url ?? ''} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href={`/communities/${community.id}`} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  )
}
