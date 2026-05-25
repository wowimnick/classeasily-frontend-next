import { proximaSoft } from "./fonts.js";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import ClientProviders from "./ClientProviders";
import FacebookPixel from "@/components/FacebookPixel";
import { OrganizationSchema, WebsiteSchema } from "./StructuredData";
import { getDefaultOgImageUrl, getSiteUrl } from "@/lib/seo";
import "./globals.css";
import "@/styles/skeleton.css";
import { Suspense } from "react";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ClassEasily - Discover Fun Local Experiences",
    template: "%s | ClassEasily",
  },
  description:
    "Discover and book unique local experiences with passionate hosts. Join as a guest for memorable adventures, workshops, and activities with friends or family.",
  keywords: [
    "experiences",
    "local hosts",
    "guest activities",
    "fun experiences",
    "local guides",
    "workshops",
    "social events",
    "hosted activities",
    "adventures",
    "learn new skills",
  ],
  authors: [{ name: "ClassEasily" }],
  creator: "ClassEasily",
  publisher: "ClassEasily",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "ClassEasily - Discover Unique Local Experiences",
    description:
      "Discover and book unique local experiences with passionate hosts. Join as a guest for memorable adventures, workshops, and activities with friends or family.",
    images: [
      {
        url: getDefaultOgImageUrl(),
        width: 1200,
        height: 630,
        alt: "ClassEasily - Discover Local Experiences",
      },
    ],
    url: getSiteUrl(),
    siteName: "ClassEasily",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClassEasily - Discover Unique Local Experiences",
    description:
      "Discover and book unique local experiences with passionate hosts. Join as a guest for memorable adventures, workshops, and activities with friends or family.",
    images: [getDefaultOgImageUrl()],
    creator: "@classeasily",
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "ClassEasily",
    statusBarStyle: "default",
    capable: true,
  },
  alternates: {
    canonical: getSiteUrl(),
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={proximaSoft.variable}>
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />

        {/* Critical CSS inline - add your above-the-fold styles here */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body{margin:0;padding:0;font-family:var(--font-proxima-soft),system-ui,-apple-system,sans-serif}
          .homepage-style{background-color:#fff;min-height:100vh}
          .main-content{display:flex;flex-direction:column;padding:0}
          :root{--ce-bp-xs:375px;--ce-bp-mobile:768px;--ce-bp-tablet:1024px;--ce-bp-desktop:1440px;--ce-bp-wide:1920px}
        `,
          }}
        />

        {/* DNS Prefetch and Preconnect for third-party domains */}
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* Preconnect for critical origins (max 4) */}
        <link rel="preconnect" href="https://cdn.lordicon.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://geocoding.classeasily.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://d2mzhwd15ea85i.cloudfront.net" crossOrigin="anonymous" />

        {/* Structured Data */}
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body>
        <SpeedInsights />
        <Analytics />

        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="lazyOnload"
        />
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
