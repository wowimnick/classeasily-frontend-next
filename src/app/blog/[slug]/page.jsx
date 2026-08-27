// src/app/blog/[slug]/page.jsx - FIXED FOR Next.js 15

import { notFound } from "next/navigation";
import BlogPostClient from "./_components/BlogPostClient";
import MarketingChrome from "@/components/marketing/MarketingChrome";

import {
  fetchBlogPosts,
  fetchBlogPostBySlug,
  fetchRecentBlogPosts,
  generateBlogPostStructuredData,
  generateBlogBreadcrumbStructuredData,
} from "@/lib/server-data-fetchers";

// CRITICAL: Generate all blog post paths at build time
const BUILD_PLACEHOLDER_SLUG = "__build_placeholder";

export async function generateStaticParams() {
  try {
    const { posts } = await fetchBlogPosts(100);
    const slugs = (posts || [])
      .filter((post) => post?.slug)
      .map((post) => ({ slug: post.slug }));

    // Next.js 16 (Cache Components) requires at least one result from generateStaticParams.
    if (slugs.length === 0) {
      return [{ slug: BUILD_PLACEHOLDER_SLUG }];
    }
    return slugs;
  } catch {
    return [{ slug: BUILD_PLACEHOLDER_SLUG }];
  }
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

  // Placeholder slug only exists so `generateStaticParams` satisfies Next when the API is empty.
  if (slug === BUILD_PLACEHOLDER_SLUG) {
    notFound();
  }

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

      <MarketingChrome>
      <BlogPostClient post={post} sidebarData={sidebarData} />
      </MarketingChrome>
    </>
  );
}
