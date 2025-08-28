/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' data:;
              connect-src 'self' 
                https://v0.dev 
                https://v0.app 
                https://v0chat.vercel.sh 
                https://vercel.live/ 
                https://vercel.com 
                https://*.pusher.com/ 
                wss://*.pusher.com/ 
                https://blob.vercel-storage.com 
                https://*.blob.vercel-storage.com 
                https://blobs.vusercontent.net 
                https://fides-vercel.us.fides.ethyca.com/api/v1/ 
                https://cdn-api.ethyca.com/location 
                https://privacy-vercel.us.fides.ethyca.com/api/v1/ 
                https://api.getkoala.com 
                https://*.sentry.io/api/ 
                https://api.v0.dev
                https://kermaslevtipgdlylzxe.supabase.co
                https://*.supabase.co;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },
}

export default nextConfig
