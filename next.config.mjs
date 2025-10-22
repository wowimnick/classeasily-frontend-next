/** @type {import('next').NextConfig} */
const nextConfig = {
  // Init
  
  compiler: {
    styledComponents: true,
    styledJsx: false,
    removeConsole: process.env.STAGE === 'test' ? false : (process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false),
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'bradfrost.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lordicon.com',
      },
      {
        protocol: 'https',
        hostname: 'd2mzhwd15ea85i.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hswstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384], // Removed 16 per Next.js 16 defaults
    minimumCacheTTL: 60 * 60 * 4, // 4 hours (Next.js 16 default, changed from 1 year)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  

  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/favicon/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [];
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
        chunks: 'all',
        cacheGroups: {
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'framework',
            priority: 40,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `npm.${packageName?.replace('@', '')}`;
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
  turbopack: process.env.NODE_ENV === 'development' ? {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  } : undefined,
  cacheComponents: true,


  experimental: {
    // NEXT.JS 16: Enable Turbopack file system caching for faster dev startup
    turbopackFileSystemCacheForDev: true,

    // Aggressive package optimization
    optimizePackageImports: [
      'antd',
      '@ant-design/icons',
      'lucide-react',
      'react-icons',
      'lodash',
      'date-fns',
      'recharts',
      'react-redux',
      '@reduxjs/toolkit',
    ],

    // CSS optimization
    optimizeCss: true,
    cssChunking: 'strict',
  },

  // React Compiler Support (stable in Next.js 16)
  // NOTE: Increases build times due to Babel dependency
  // reactCompiler: true,

  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
  compress: process.env.STAGE !== 'test',
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
  productionBrowserSourceMaps: process.env.STAGE === 'test' || process.env.NODE_ENV === 'development',
};

export default nextConfig;