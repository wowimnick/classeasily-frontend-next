// src/app/blog/page.jsx - FIXED FOR STATIC GENERATION + SEO + Next.js 16

import BlogPageClient from "./_components/BlogPageClient";
import MarketingChrome from "@/components/marketing/MarketingChrome";

import {
  fetchBlogPosts,
  generateBlogStructuredData,
} from "@/lib/server-data-fetchers";

export const metadata = {
  title: "The ClassEasily Blog",
  description:
    "Tips on booking software, running a small service business, and getting more customers from your website.",
  keywords:
    "booking software, small business, booking widget, CRM, class booking",
  openGraph: {
    title: "The ClassEasily Blog",
    description:
      "Insights for small businesses using ClassEasily for bookings and CRM.",
    type: "website",
    url: "https://classeasily.com/blog",
    siteName: "ClassEasily",
    images: [
      {
        url: "https://classeasily.com/images/blog-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ClassEasily Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The ClassEasily Blog",
    description: "Insights for small businesses using ClassEasily for bookings and CRM.",
    images: ["https://classeasily.com/images/blog-og-image.jpg"],
  },
  alternates: {
    canonical: "https://classeasily.com/blog",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function BlogPage() {
  // Fetch at build time (static generation) using helper function
  const { posts } = await fetchBlogPosts(50);
  const structuredData = generateBlogStructuredData(posts);

  return (
    <>
      {/* Add structured data for Google */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <MarketingChrome>
      <BlogPageClient posts={posts} />
      </MarketingChrome>
    </>
  );
}
