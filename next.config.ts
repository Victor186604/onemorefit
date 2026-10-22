import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 15: serverExternalPackages substituiu experimental.serverComponentsExternalPackages
  serverExternalPackages: ['@electric-sql/pglite', 'bcryptjs', 'pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
