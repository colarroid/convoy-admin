'use client'

import { useState } from 'react'

/** Server-signed Cloudinary image upload. Writes the secure_url into a hidden input. */
export default function LogoUpload({
  defaultUrl = '',
  name = 'logo_url',
  hint = 'Square image recommended. Shown wherever members see this community.',
  wide = false,
}: {
  defaultUrl?: string
  /** Form field the uploaded URL is submitted as. */
  name?: string
  hint?: string
  /** Wide preview, for article cover images rather than square logos. */
  wide?: boolean
}) {
  const [url, setUrl] = useState(defaultUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      // Ask our server for a short-lived signature (admin-gated).
      const signRes = await fetch('/api/cloudinary/sign', { method: 'POST' })
      if (!signRes.ok) {
        let detail = ''
        try { detail = (await signRes.json())?.error ?? '' } catch { /* ignore */ }
        throw new Error(detail || 'Could not prepare the upload.')
      }
      const { cloudName, apiKey, timestamp, signature, folder } = await signRes.json()

      const form = new FormData()
      form.append('file', file)
      form.append('api_key', apiKey)
      form.append('timestamp', String(timestamp))
      form.append('signature', signature)
      form.append('folder', folder)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Upload failed')
      setUrl(json.secure_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className={`${wide ? 'w-32 h-20' : 'w-16 h-16'} rounded-md overflow-hidden bg-white border border-[var(--border,#E5E7EB)] flex items-center justify-center shrink-0`}>
          {url
            ? <img src={url} alt="Preview" className={`w-full h-full ${wide ? 'object-cover' : 'object-contain'}`} />
            : <span className="text-xs text-secondary">No image</span>}
        </div>
        <label className="btn-secondary cursor-pointer">
          {uploading ? 'Uploading…' : url ? 'Change image' : 'Upload image'}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-secondary mt-2">{hint}</p>
    </div>
  )
}
