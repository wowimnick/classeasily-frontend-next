// src/app/blog/[slug]/page.jsx - FIXED FOR Next.js 15

import { notFound } from "next/navigation";
import Footer from "@/components/homepage/Footer";
import BlogPostClient from "./_components/BlogPostClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

import {
  fetchBlogPosts,
  fetchBlogPostBySlug,
  fetchRecentBlogPosts,
  generateBlogPostStructuredData,
  generateBlogBreadcrumbStructuredData,
} from "@/lib/server-data-fetchers";

// CRITICAL: Generate all blog post paths at build time
export async function generateStaticParams() {
  const { posts } = await fetchBlogPosts(100);
  return posts.map((post) => ({ slug: post.slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  // FIXED: Await params in Next.js 15
  const { slug } = await params;

  try {
    const result = await fetchBlogPostBySlug(slug);

    if (!result.success) {
      return {
        title: "Post Not Found | ClassEasily Blog",
        description: "The blog post you're looking for could not be found.",
      };
    }

    const post = result.data;

    return {
      title: `${post.title} | ClassEasily Blog`,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        url: `https://classeasily.com/blog/${post.slug}`,
        siteName: "ClassEasily",
        publishedTime: post.publishedDate,
        modifiedTime: post.updatedDate || post.publishedDate,
        images: [
          {
            url: post.imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [post.imageUrl],
      },
      alternates: {
        canonical: `https://classeasily.com/blog/${post.slug}`,
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
  } catch {
    return {
      title: "Post Not Found | ClassEasily Blog",
      description: "The blog post you're looking for could not be found.",
    };
  }
}

export default async function BlogPostPage({ params }) {
  // FIXED: Await params in Next.js 15
  const { slug } = await params;

  // Fetch all data at build time (static generation) using helper functions
  const [postResult, recentPostsResult] = await Promise.all([
    fetchBlogPostBySlug(slug),
    fetchRecentBlogPosts(4),
  ]);

  // Handle 404
  if (!postResult.success) {
    notFound();
  }

  const post = postResult.data;
  const sidebarData = {
    recentPosts: recentPostsResult.posts || [],
  };

  const postStructuredData = generateBlogPostStructuredData(post);
  const breadcrumbStructuredData = generateBlogBreadcrumbStructuredData(post);

  return (
    <>
      {/* Add structured data for Google */}
      {postStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(postStructuredData),
          }}
        />
      )}
      {breadcrumbStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData),
          }}
        />
      )}

      <ExploreHeader showOptionsWrapper={false} />
      <BlogPostClient post={post} sidebarData={sidebarData} />
      <Footer />
    </>
  );
}
