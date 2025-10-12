/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-cleanup/ui', '@ai-cleanup/types'],
  experimental: {
    optimizePackageImports: ['@ai-cleanup/ui'],
  },
};

module.exports = nextConfig;

