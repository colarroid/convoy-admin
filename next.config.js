/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async redirects() {
    return [
      // Vercel always publishes the project on a .vercel.app production URL that
      // cannot be removed, so the dashboard is reachable on a second host. Send
      // it to the canonical domain.
      //
      // Matched on the exact production alias rather than *.vercel.app, so
      // preview deployments keep working.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'convoy-admin.vercel.app' }],
        destination: 'https://administrator.veesaa.co/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
