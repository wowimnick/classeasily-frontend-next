// src/app/blog/page.jsx - FIXED FOR STATIC GENERATION + SEO + Next.js 16

import Footer from "@/components/homepage/Footer";
import BlogPageClient from "./_components/BlogPageClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

import {
  fetchBlogPosts,
  generateBlogStructuredData,
} from "@/lib/server-data-fetchers";

export const metadata = {
  title: "The ClassEasily Blog | Insights for Learners and Instructors",
  description:
    "Discover expert tips, learning strategies, and instructor insights. Your guide to making the most of online and in-person classes.",
  keywords:
    "online classes, learning tips, instructor insights, education blog, class finder",
  openGraph: {
    title: "The ClassEasily Blog | Expert Learning Insights",
    description:
      "Inspiration and insights for our community of learners and instructors.",
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
    description: "Expert insights for learners and instructors",
    images: ["https://classeasily.com/images/blog-og-image.jpg"],
  },
  alternates: {
    canonical: "https://classeasily.com/blog",
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

      <ExploreHeader showOptionsWrapper={false} />
      <BlogPageClient posts={posts} />
      <Footer />
    </>
  );
}
