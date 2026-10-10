import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'revain-delta.vercel.app',
          },
        ],
        destination: 'https://siplo.vercel.app/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'revain-growth-by-saurabh.vercel.app',
          },
        ],
        destination: 'https://siplo.vercel.app/:path*',
        permanent: true,
      },
      {
        source: '/c/:slug',
        destination: '/c?store=:slug',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
