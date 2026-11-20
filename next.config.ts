import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'pg', 'bcryptjs', 'sanitize-html', 'pdf-lib'],
  poweredByHeader: false,
}

export default nextConfig
