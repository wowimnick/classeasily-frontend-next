import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Init

  compiler: {
    styledComponents: true,
    styledJsx: false,
    removeConsole:
      process.env.STAGE === "test"
        ? false
        : process.env.NODE_ENV === "production"
          ? {
              exclude: ["error", "warn"],
            }
          : false,
  },

  images: {
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

  // Webpack optimizations for better code splitting and smaller bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for framer-motion (if still used elsewhere)
            framerMotion: {
              name: "framer-motion",
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: "all",
              priority: 30,
            },
            // Separate chunk for react-leaflet (map library)
            leaflet: {
              name: "leaflet",
              test: /[\\/]node_modules[\\/](react-leaflet|leaflet)[\\/]/,
              chunks: "all",
              priority: 30,
            },
            // Common chunk for shared code
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
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
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
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: "framework",
            priority: 40,
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

    // CSS optimization
    optimizeCss: true,
    cssChunking: "strict",
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

export default withBundleAnalyzer(nextConfig);
