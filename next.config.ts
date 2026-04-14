import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // output: 'export' only in production — dev mode doesn't support unknown dynamic params
  // User trips are stored in localStorage (unknown at build time), so we rely on
  // Firebase's SPA rewrite (** → /index.html) to serve them at runtime.
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
}

export default nextConfig
