/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-cleanup/types', '@ai-cleanup/ui'],
  images: {
    domains: [],
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
    outputFileTracingIgnores: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.next/**',
      '**/dist/**',
      '**/backend/**',
      '**/venv/**',
      '**/__pycache__/**',
      '**/test_files/**',
      '**/monitoring/**',
      '**/diagrams/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
};

module.exports = nextConfig;
