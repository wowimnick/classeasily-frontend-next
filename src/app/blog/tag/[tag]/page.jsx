// Blog tag archive: /blog/tag/[tag] — SEO-friendly, static generation

import { notFound } from "next/navigation";
import Footer from "@/components/homepage/Footer";
import ExploreHeader from "@/components/explore/ExploreHeader";
import {
  fetchBlogPosts,
  fetchBlogPostsByTag,
  generateBlogStructuredData,
} from "@/lib/server-data-fetchers";
import BlogPageClient from "../../_components/BlogPageClient";

const BASE = "https://classeasily.com";

/** Derive display name from URL tag slug (e.g. "education" -> "Education", "some-tag" -> "Some Tag") */
function tagSlugToName(tagSlug) {
  return tagSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateStaticParams() {
  // Tag pages are dynamic; we don't pre-render every possible tag
  return [];
}

export async function generateMetadata({ params }) {
  const { tag: tagSlug } = await params;
  const tagName = tagSlugToName(tagSlug);
  const title = `${tagName} | ClassEasily Blog`;
  const description = `Blog posts tagged with ${tagName}. Tips and insights for learners and instructors.`;
  const url = `${BASE}/blog/tag/${tagSlug}`;

  return {
    title,
    description,
    keywords: ["blog", "tag", tagName, "ClassEasily"].join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "ClassEasily",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function BlogTagPage({ params }) {
  const { tag: tagSlug } = await params;

  const { posts, count } = await fetchBlogPostsByTag(tagSlug, 50);

  const tagName = tagSlugToName(tagSlug);
  const subtitle =
    count !== undefined
      ? `${count} ${count === 1 ? "post" : "posts"} tagged with "${tagName}".`
      : `Posts tagged with "${tagName}".`;

  const structuredData = generateBlogStructuredData(posts);
  const listStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE}/blog/tag/${tagSlug}`,
    name: `${tagName} | ClassEasily Blog`,
    description: subtitle,
    url: `${BASE}/blog/tag/${tagSlug}`,
    isPartOf: { "@id": `${BASE}/blog` },
    ...(structuredData?.blogPost && {
      mainEntity: {
        "@type": "ItemList",
        itemListElement: structuredData.blogPost.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item,
        })),
      },
    }),
  };

  return (
    <>
      {listStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listStructuredData) }}
        />
      )}

      <ExploreHeader showOptionsWrapper={false} />
      <div className="blog-tag-page">
        <BlogPageClient
          posts={posts}
          title={`Tag: ${tagName}`}
          subtitle={subtitle}
        />
      </div>
      <Footer />
    </>
  );
}
