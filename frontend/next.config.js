/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
    return [
      {
        source: '/api/:path*',
        destination: apiBase ? `${apiBase}/api/:path*` : 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
