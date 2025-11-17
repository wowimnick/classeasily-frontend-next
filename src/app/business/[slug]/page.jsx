// app/businesses/[slug]/page.jsx (or app/business/[slug]/page.jsx - whatever your route is)

import { notFound } from "next/navigation";
import BusinessPageClient from "../_components/BusinessPageClient";
import {
  fetchBusinessDetail,
  fetchPublicBusinesses,
} from "@/lib/server-data-fetchers";

// Generate static params for business pages at build time
export async function generateStaticParams() {
  try {
    const businessesResult = await fetchPublicBusinesses();

    if (!businessesResult.success || !businessesResult.data) {
      console.warn("No businesses found for static generation");
      return [];
    }

    const businesses = businessesResult.results || [];
    const paths = businesses.map((business) => ({
      slug: business.slug,
    }));

    console.log(`[Build] Generated ${paths.length} static business pages`);
    return paths;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  const result = await fetchBusinessDetail(slug);
  const businessData = result.success ? result.data : null;

  if (!businessData) {
    return {
      title: "Business Not Found | Classeasily",
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

  const pageTitle = `${businessName} - Classes in ${businessCity} | Classeasily`;

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
      canonical: `https://classeasily.com/businesses/${slug}`,
    },
  };
}

// Main page component
export default async function BusinessPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  console.log(`[Business Page] Rendering: ${slug}`);

  // Fetch business data using server-data-fetchers
  const result = await fetchBusinessDetail(slug);
  const businessData = result.success ? result.data : null;

  // Return 404 if business not found
  if (!businessData) {
    console.warn(`[Business Page] Not found: ${slug}`);
    notFound();
  }

  // Validate required data
  if (!businessData.businessName || !businessData.slug) {
    console.error("[Business Page] Invalid data structure:", businessData);
    notFound();
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://classeasily.com/businesses/${slug}`,
    name: businessData.businessName,
    description: businessData.businessDescription,
    image: businessData.business_image_medium_url,
    address: {
      "@type": "PostalAddress",
      streetAddress: businessData.businessAddress,
      addressLocality: businessData.businessCity,
      addressRegion: businessData.businessState,
      addressCountry: "CA",
    },
    aggregateRating: businessData.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: parseFloat(businessData.average_rating),
          reviewCount: businessData.totalReviews || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    url: `https://classeasily.com/businesses/${slug}`,
    telephone: businessData.studentContactPhone,
    email: businessData.studentContactEmail,
    openingHoursSpecification:
      businessData.businessHours?.map((hours) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.day,
        opens: hours.isOpen ? hours.open : undefined,
        closes: hours.isOpen ? hours.close : undefined,
      })) || undefined,
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://classeasily.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Businesses",
        item: "https://classeasily.com/businesses",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: businessData.businessName,
        item: `https://classeasily.com/businesses/${slug}`,
      },
    ],
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      {/* Client Component with data */}
      <BusinessPageClient initialData={businessData} slug={slug} />
    </>
  );
}
