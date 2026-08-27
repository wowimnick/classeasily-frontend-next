// Blog category archive: /blog/category/[slug] — SEO-friendly, static generation

import { notFound } from "next/navigation";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import {
  fetchBlogCategories,
  fetchBlogPostsByCategory,
  generateBlogStructuredData,
} from "@/lib/server-data-fetchers";
import BlogPageClient from "../../_components/BlogPageClient";

const BASE = "https://classeasily.com";

export async function generateStaticParams() {
  const { categories } = await fetchBlogCategories();
  const list = (categories || []).map((cat) => ({ slug: cat.slug }));
  if (list.length === 0) {
    return [{ slug: "_" }];
  }
  return list;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { categories } = await fetchBlogCategories();
  const category = categories?.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: "Category Not Found | ClassEasily Blog",
      description: "The blog category you're looking for could not be found.",
    };
  }

  const title = `${category.name} | ClassEasily Blog`;
  const description = `Browse all posts in ${category.name}. Tips and insights for learners and instructors.`;
  const url = `${BASE}/blog/category/${slug}`;

  return {
    title,
    description,
    keywords: ["blog", "category", category.name, "ClassEasily"].join(", "),
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

export default async function BlogCategoryPage({ params }) {
  const { slug } = await params;

  if (slug === "_") {
    notFound();
  }

  const [{ categories }, { posts }] = await Promise.all([
    fetchBlogCategories(),
    fetchBlogPostsByCategory(slug, 50),
  ]);

  const category = categories?.find((c) => c.slug === slug);
  if (!category) notFound();

  const structuredData = generateBlogStructuredData(posts);
  const listStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE}/blog/category/${slug}`,
    name: `${category.name} | ClassEasily Blog`,
    description: `Posts in category: ${category.name}`,
    url: `${BASE}/blog/category/${slug}`,
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

      <MarketingChrome>
      <div className="blog-category-page">
        <BlogPageClient
          posts={posts}
          title={`${category.name}`}
          subtitle={`${category.post_count || posts.length} ${(category.post_count || posts.length) === 1 ? "post" : "posts"} in this category.`}
        />
      </div>
      </MarketingChrome>
    </>
  );
}
