import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/c/:slug',
        destination: '/c?store=:slug',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
