// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@ai-cleanup/types', '@ai-cleanup/ui'],

  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  compress: true,

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/downloads/:path*',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'attachment',
          },
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  experimental: {
    largePageDataBytes: 128 * 100000,
  },

  outputFileTracingIgnores: [
    '**/.git/**',
    '**/node_modules/**',
    '**/test_files/**',
    '**/demo_dataset/**',
    '**/services/**',
  ],
};

module.exports = nextConfig;
