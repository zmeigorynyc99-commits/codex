/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal, self-contained server bundle for small VPS containers.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Security headers that are static (not request-specific). The per-request
  // Content-Security-Policy with a nonce is set in middleware.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
