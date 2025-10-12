/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-cleanup/types', '@ai-cleanup/ui'],
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
