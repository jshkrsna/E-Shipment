import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'bcryptjs', 'sanitize-html', 'pdf-lib'],
  poweredByHeader: false,
}

export default nextConfig
