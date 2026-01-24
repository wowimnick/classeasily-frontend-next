import { proximaSoft } from "./fonts.js";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import ClientProviders from "./ClientProviders";
import { OrganizationSchema, WebsiteSchema } from "./StructuredData";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: {
    default: "Classeasily - Discover Fun Local Experiences",
    template: "%s | Classeasily",
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
  authors: [{ name: "Classeasily" }],
  creator: "Classeasily",
  publisher: "Classeasily",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Classeasily - Discover Unique Local Experiences",
    description:
      "Discover and book unique local experiences with passionate hosts. Join as a guest for memorable adventures, workshops, and activities with friends or family.",
    images: [
      {
        url: "https://i.imgur.com/biTTckW.png",
        width: 1200,
        height: 630,
        alt: "Classeasily - Discover Local Experiences",
      },
    ],
    url: "https://classeasily.com",
    siteName: "Classeasily",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Classeasily - Discover Unique Local Experiences",
    description:
      "Discover and book unique local experiences with passionate hosts. Join as a guest for memorable adventures, workshops, and activities with friends or family.",
    images: ["https://i.imgur.com/biTTckW.png"],
    creator: "@classeasily",
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "Classeasily",
    statusBarStyle: "default",
    capable: true,
  },
  alternates: {
    canonical: "https://classeasily.com",
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
        `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '910730058202180');fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=910730058202180&ev=PageView&noscript=1"
          />
        </noscript>

        {/* DNS Prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://cdn.lordicon.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        <link
          rel="preload"
          as="image"
          href="/homepageMobile.webp"
          fetchPriority="high"
          type="image/webp"
        />

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

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
