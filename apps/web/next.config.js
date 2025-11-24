// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-cleanup/types', '@ai-cleanup/ui'],
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
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
    ];
  },
  experimental: {
    largePageDataBytes: 128 * 100000,
  },
};

module.exports = nextConfig;
