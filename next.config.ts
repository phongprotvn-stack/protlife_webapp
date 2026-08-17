import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // HTML pages: no cache — always get fresh version
      source: '/:path((?!_next|sw\\.js|icon|favicon|manifest).*)',
      has: [{ type: 'header', key: 'accept', value: 'text/html.*' }],
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
      ],
    },
    {
      // Service worker: never cache
      source: '/sw.js',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/javascript; charset=utf-8',
        },
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
    {
      // Security headers
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

export default nextConfig;
