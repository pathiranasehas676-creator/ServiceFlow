import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/api\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/worker\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/admin\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'apis',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\.(?:mp3|wav|m4a)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-audio-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-style-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-data',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\.(?:json|xml|csv)$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'static-data-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: ({ url }: any) => {
          const isSameOrigin = self.origin === url.origin;
          if (!isSameOrigin) return false;
          const pathname = url.pathname;
          return !pathname.startsWith('/api/');
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // output: "export", // not needed unless static export
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
