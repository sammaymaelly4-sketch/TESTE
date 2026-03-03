/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['xxxx.supabase.co'],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}
module.exports = nextConfig
