// app/businesses/[slug]/page.jsx (or app/business/[slug]/page.jsx - whatever your route is)

import { notFound, permanentRedirect } from "next/navigation";
import BusinessPageClient from "../_components/BusinessPageClient";
import {
  fetchBusinessDetail,
  fetchPublicBusinesses,
} from "@/lib/server-data-fetchers";

// Generate static params for business pages at build time
const BUILD_PLACEHOLDER_SLUG = "__build_placeholder";

export async function generateStaticParams() {
  try {
    const businessesResult = await fetchPublicBusinesses();

    if (!businessesResult.success || !businessesResult.data) {
      console.warn("No businesses found for static generation");
      return [{ slug: BUILD_PLACEHOLDER_SLUG }];
    }

    const businesses = businessesResult.results || [];
    const paths = businesses
      .filter((business) => business?.slug)
      .map((business) => ({
        slug: business.slug,
      }));

    console.log(`[Build] Generated ${paths.length} static business pages`);

    // Next.js 16 (Cache Components) requires at least one result from generateStaticParams.
    if (paths.length === 0) {
      return [{ slug: BUILD_PLACEHOLDER_SLUG }];
    }
    return paths;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [{ slug: BUILD_PLACEHOLDER_SLUG }];
  }
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: "ClassEasily",
    robots: { index: false, follow: false },
  };
}

async function generateMetadataMarketplace({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  const result = await fetchBusinessDetail(slug);
  const businessData = result.success ? result.data : null;

  if (!businessData) {
    return {
      title: "Business Not Found | ClassEasily",
      description: "The requested business could not be found.",
    };
  }

  const {
    businessName,
    businessDescription,
    business_image_medium_url,
    businessCity,
    businessState,
  } = businessData;

  const pageDescription =
    businessDescription?.substring(0, 160) ||
    `Explore classes and reviews for ${businessName} in ${businessCity}, ${businessState}.`;

  const pageTitle = `${businessName} - Classes in ${businessCity} | ClassEasily`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      images: business_image_medium_url
        ? [
            {
              url: business_image_medium_url,
              width: 1200,
              height: 630,
              alt: `${businessName} logo`,
            },
          ]
        : [],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: business_image_medium_url ? [business_image_medium_url] : [],
    },
    alternates: {
      canonical: `https://classeasily.com/business/${slug}`,
    },
  };
}

// Main page component
export default async function BusinessPage({ params }) {
  await Promise.resolve(params);
  permanentRedirect("/");
}
