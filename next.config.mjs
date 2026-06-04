import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Init

  compiler: {
    styledComponents: true,
    styledJsx: false,
    // Keep all console methods on test and staging (Vercel preview) so [Meta Pixel] logs are visible
    removeConsole:
      process.env.STAGE === "test" || process.env.VERCEL_ENV === "preview"
        ? false
        : process.env.NODE_ENV === "production"
          ? {
              exclude: ["error", "warn"],
            }
          : false,
  },

  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "bradfrost.com",
      },
      {
        protocol: "https",
        hostname: "cdn.lordicon.com",
      },
      {
        protocol: "https",
        hostname: "d2mzhwd15ea85i.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "cdn.hswstatic.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384], // Removed 16 per Next.js 16 defaults
    minimumCacheTTL: 60 * 60 * 4, // 4 hours (Next.js 16 default, changed from 1 year)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  reactStrictMode: true,

  async headers() {
    return [
      // Global security headers - MUST BE FIRST
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // same-origin-allow-popups required for Google OAuth popup to communicate back to opener
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },

      // Static assets from /public folder - 1 YEAR CACHE, IMMUTABLE
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // Next.js internal static assets - 1 YEAR CACHE (Vercel handles this, but explicit is better)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // Favicon - 1 YEAR CACHE
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async rewrites() {
    // Backend API URL (without /api suffix) for robots.txt and sitemap - DJANGO
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const backendUrl = apiUrl.replace(/\/api$/, "");

    // CloudFront URL for static files from S3
    const cloudFrontUrl =
      process.env.NEXT_PUBLIC_CLOUDFRONT_URL ||
      "https://d1uuoquc68y10e.cloudfront.net";

    // PostHog host URL for reverse proxy
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    return {
      beforeFiles: [
        // These run BEFORE Next.js checks for pages/static files
        // Proxy /widget/* to CloudFront (widget static files)
        {
          source: "/widget/:path*",
          destination: `${cloudFrontUrl}/widget/:path*`,
        },
        // PostHog reverse proxy for static assets
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        // PostHog reverse proxy for analytics
        {
          source: "/ingest/:path*",
          destination: `${posthogHost}/:path*`,
        },
      ],
      afterFiles: [
        // These run AFTER Next.js checks for pages/static files
        // Proxy robots.txt and sitemap to Django backend (dynamically generated)
        {
          source: "/robots.txt",
          destination: `${backendUrl}/robots.txt`,
        },
        {
          source: "/sitemap.xml",
          destination: `${backendUrl}/sitemap.xml`,
        },
        // Proxy /public/* to CloudFront (S3 static files)
        {
          source: "/public/:path*",
          destination: `${cloudFrontUrl}/public/:path*`,
        },
      ],
    };
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      {
        source: "/verify-email/:key",
        destination: "/?verify_email_key=:key",
        permanent: false,
      },
      {
        source: "/account-confirm-email/:key",
        destination: "/?verify_email_key=:key",
        permanent: false,
      },
      {
        source: "/business/classes",
        destination: "/business/dashboard/classes",
        permanent: false,
      },
      {
        source: "/guest/cancel/:token",
        destination: "/?cancel_token=:token",
        permanent: false,
      },
      {
        source: "/join-business",
        destination: "/",
        permanent: false,
      },
      {
        source: "/business/join",
        destination: "/",
        permanent: false,
      },
      {
        source: "/business/accept-invite",
        destination: "/",
        permanent: false,
      },
      {
        source: "/reset-password/:uid/:token",
        destination: "/?reset_uid=:uid&reset_token=:token",
        permanent: false,
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300,
      };
    }

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "framework",
              chunks: "all",
              priority: 40,
            },
            framerMotion: {
              name: "framer-motion",
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: "all",
              priority: 35,
            },
            leaflet: {
              name: "leaflet",
              test: /[\\/]node_modules[\\/](react-leaflet|leaflet)[\\/]/,
              chunks: "all",
              priority: 35,
            },
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/,
                )?.[1];
                return `npm.${packageName?.replace("@", "")}`;
              },
              priority: 30,
              minChunks: 1,
              maxSize: 100000, // 100KB max per chunk
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // NEXT.JS 16: Turbopack is now stable and default (moved out of experimental)
  turbopack:
    process.env.NODE_ENV === "development"
      ? {
          rules: {
            "*.svg": {
              loaders: ["@svgr/webpack"],
              as: "*.js",
            },
          },
        }
      : undefined,
  cacheComponents: true,

  /** Custom cache life profiles for `"use cache"` + cacheLife("blog" | "classDetail" | "homepage") */
  cacheLife: {
    blog: { stale: 3600, revalidate: 900, expire: 86400 },
    classDetail: { stale: 1800, revalidate: 600, expire: 7200 },
    homepage: { stale: 1800, revalidate: 900, expire: 3600 },
  },

  experimental: {
    // NEXT.JS 16: Enable Turbopack file system caching for faster dev startup
    turbopackFileSystemCacheForDev: true,

    // Aggressive package optimization
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "lucide-react",
      "react-icons",
      "lodash",
      "date-fns",
      "recharts",
      "react-redux",
      "@reduxjs/toolkit",
    ],

    // NOTE: `optimizeCss` (Critters) was removed — it is deprecated and
    // incompatible with App Router streaming. With `cacheComponents: true`
    // the homepage uses PPR/streaming, and Critters caused the dev server
    // to hang during hydration on `/`.
    // See: https://github.com/vercel/next.js/discussions/59989
    //
    // `cssChunking` kept on default ("loose"). "strict" mode is known to
    // ship non-deterministic CSS ordering in Turbopack (#89523) and is
    // not needed for this app.
  },

  // React Compiler Support (stable in Next.js 16)
  // NOTE: Increases build times due to Babel dependency
  // reactCompiler: true,

  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  poweredByHeader: false,
  compress: process.env.STAGE !== "test",
  generateEtags: true,

  httpAgentOptions: {
    keepAlive: true,
  },

  // Reduce logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Source maps only in development and test
  productionBrowserSourceMaps:
    process.env.STAGE === "test" || process.env.NODE_ENV === "development",
};

// Bundle analyzer: run with npm run analyze (ANALYZE=true next build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "classeasily",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
