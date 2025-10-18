// src/app/blog/category/[categorySlug]/page.jsx - FIXED

import { notFound } from "next/navigation";
import Footer from "@/components/homepage/Footer";
import CategoryPageClient from "../_components/CategoryPageClient";
import ClientHeader from "@/components/layout/ClientHeader";
import {
  fetchBlogCategories,
  fetchBlogPostsByCategory,
  generateBlogStructuredData,
} from "@/lib/server-data-fetchers";

// Generate static params for all categories at build time
export async function generateStaticParams() {
  const { categories } = await fetchBlogCategories();
  return categories.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }) {
  const { categorySlug } = params;
  const { categories } = await fetchBlogCategories();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return {
      title: "Category Not Found | ClassEasily Blog",
      description: "The category you're looking for could not be found.",
    };
  }

  return {
    title: `${category.name} | ClassEasily Blog`,
    description: `Browse ${category.name} articles on the ClassEasily Blog. Expert insights for learners and instructors.`,
    keywords: `${category.name}, blog, education, learning`,
    openGraph: {
      title: `${category.name} | ClassEasily Blog`,
      description: `Browse ${category.name} articles on the ClassEasily Blog.`,
      type: "website",
      url: `https://www.classeasily.com/blog/category/${category.slug}`,
      siteName: "ClassEasily",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ClassEasily Blog`,
      description: `Browse ${category.name} articles on the ClassEasily Blog.`,
    },
    alternates: {
      canonical: `https://www.classeasily.com/blog/category/${category.slug}`,
    },
  };
}

export default async function CategoryBlogPage({ params }) {
  const { categorySlug } = params;

  // Fetch all data at build time using helper functions
  const [postsResult, categoriesResult] = await Promise.all([
    fetchBlogPostsByCategory(categorySlug, 50),
    fetchBlogCategories(),
  ]);

  const posts = postsResult.posts;
  const category = categoriesResult.categories.find(
    (c) => c.slug === categorySlug
  );

  // If category doesn't exist, show 404
  if (!category) {
    notFound();
  }

  // Generate structured data for SEO
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

      <ClientHeader showOptionsWrapper={false} />
      <CategoryPageClient posts={posts} category={category} />
      <Footer />
    </>
  );
}
