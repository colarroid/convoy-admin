import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getAdminUser } from '@/lib/auth'

// Signs Cloudinary community-logo uploads server-side so the API secret never
// reaches the browser and only signed-in admins can upload. Replaces the old
// unsigned preset.
export const runtime = 'nodejs'

const FOLDER = 'veesaa/community-logos'

export async function POST() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary is not configured.' }, { status: 500 })
  }

  // Only authenticated admins may request a signature.
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 })
  }

  // Cloudinary signature: sha1 of the alphabetically-sorted params + api secret.
  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(toSign + apiSecret).digest('hex')

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder: FOLDER })
}
