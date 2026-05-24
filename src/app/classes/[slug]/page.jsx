import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";

import {
  fetchClassDetail,
  fetchBusinessDetail,
  fetchClassReviews,
} from "@/lib/server-data-fetchers";
import FooterSmart from "@/components/homepage/FooterSmart.jsx";
import ClassPageClient from "../_components/ClassPageClient";
import ClassReviewsSeo from "../_components/ClassReviewsSeo";
import {
  getSiteUrl,
  toSchemaPriceCurrency,
} from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** API may return non-strings; metadata + JSON-LD must not call string methods blindly. */
function safeTextSnippet(value, maxLen) {
  if (value == null) return "";
  const s = String(value);
  if (!s.trim()) return "";
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}...`;
}

function stripHtmlToText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** DRF may serialize Decimals as strings; `.toFixed` only exists on numbers. */
function formatRatingOneDecimal(value) {
  if (value == null || value === "") return "0";
  const n = typeof value === "number" ? value : parseFloat(String(value), 10);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchClassesPageWithRetries(pageNum, attempts = 4) {
  if (!BASE_URL) return null;
  const url = `${BASE_URL}/classes/?page=${pageNum}&page_size=100`;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) return response;
      const transient =
        response.status === 429 ||
        response.status >= 500 ||
        response.status === 408;
      if (transient && attempt < attempts) {
        await sleep(280 * attempt + Math.floor(Math.random() * 120));
        continue;
      }
      return response;
    } catch {
      if (attempt < attempts) {
        await sleep(280 * attempt + Math.floor(Math.random() * 120));
        continue;
      }
      return null;
    }
  }
  return null;
}

// Generate static params - fetch ALL classes
export async function generateStaticParams() {
  try {
    const allClasses = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      const response = await fetchClassesPageWithRetries(page);
      if (!response?.ok) {
        break;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        break;
      }

      if (data.results && Array.isArray(data.results)) {
        allClasses.push(...data.results);
        hasMore = !!data.next;
        page++;
      } else {
        hasMore = false;
      }

      if (hasMore) {
        await sleep(200);
      }
    }

    const slugs = allClasses
      .filter((classItem) => classItem.slug)
      .map((classItem) => ({ slug: classItem.slug }));

    // Next.js 16 (Cache Components) requires at least one result from generateStaticParams.
    if (slugs.length === 0) {
      return [{ slug: "__build_placeholder" }];
    }
    return slugs;
  } catch {
    return [{ slug: "__build_placeholder" }];
  }
}

// Fetch class data with proper tagged business fetch (fetch helpers swallow errors; no try/catch around notFound())
async function getClassData(slug) {
  if (!slug) {
    notFound();
  }

  // Placeholder slug only exists so `generateStaticParams` satisfies Next when the API is empty.
  if (slug === "__build_placeholder") {
    notFound();
  }

  const classResult = await fetchClassDetail(slug);

  if (!classResult.success || !classResult.data) {
    notFound();
  }

  const classData = classResult.data;

  const [businessFetchResult, reviewsFetchResult] = await Promise.all([
    classData.business_slug
      ? fetchBusinessDetail(classData.business_slug)
      : Promise.resolve({ success: false, data: null }),
    classData.review_count > 0
      ? fetchClassReviews(slug, 1, 6)
      : Promise.resolve({ success: true, data: [] }),
  ]);

  const businessResult =
    businessFetchResult.success && businessFetchResult.data
      ? businessFetchResult.data
      : null;
  const reviewsResult =
    reviewsFetchResult.success && Array.isArray(reviewsFetchResult.data)
      ? reviewsFetchResult.data
      : null;

  return {
    classData,
    businessData: businessResult,
    initialReviews: reviewsResult,
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { classData, businessData } = await getClassData(resolvedParams.slug);

  if (
    classData?.slug &&
    resolvedParams.slug &&
    resolvedParams.slug !== classData.slug
  ) {
    permanentRedirect(`/classes/${classData.slug}`);
  }

  const site = getSiteUrl();
  const pageTitle = classData?.title
    ? `${String(classData.title)} | ClassEasily`
    : "Experience Details | ClassEasily";
  const pageDescription =
    safeTextSnippet(classData?.description, 160) ||
    "View details and book this experience for your next date night or friend gathering on ClassEasily.";
  const canonicalUrl = `${site}/classes/${classData.slug}`;
  const imageUrl =
    classData.images?.length > 0
      ? classData.images[0].medium_url || classData.images[0].original_url
      : `${site}/placeholder-image.jpg`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "ClassEasily",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt:
            classData?.title != null
              ? String(classData.title)
              : "Class experience",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
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
}

// Build Course JSON-LD for <script type="application/ld+json"> (must not be in metadata.other)
function buildCourseSchema(classData, businessData) {
  const site = getSiteUrl();
  const imageUrl =
    classData.images?.length > 0
      ? classData.images[0].medium_url || classData.images[0].original_url
      : `${site}/placeholder-image.jpg`;
  let geoCoordinates = null;
  if (classData.coordinates != null && typeof classData.coordinates === "string") {
    const parts = classData.coordinates.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        geoCoordinates = {
          "@type": "GeoCoordinates",
          latitude: lat,
          longitude: lng,
        };
      }
    }
  }

  const addressCountry =
    classData.business_country ||
    classData.country_code ||
    businessData?.country ||
    businessData?.country_code ||
    "CA";

  const reviewCount = Number(classData.review_count) || 0;
  const ratingBlock =
    reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: formatRatingOneDecimal(classData.average_rating),
            reviewCount: String(reviewCount),
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: classData.title != null ? String(classData.title) : "",
    description:
      classData.description != null ? String(classData.description) : "",
    image: imageUrl,
    courseCode: `CLASS-${classData.classId}`,
    provider: {
      "@type": "Organization",
      name: businessData?.businessName || "ClassEasily Host",
      url: businessData?.website || site,
    },
    location: {
      "@type": "Place",
      name: businessData?.businessName || "Event Location",
      address: {
        "@type": "PostalAddress",
        streetAddress: classData.location || "",
        addressLocality: classData.business_city || "",
        addressRegion: classData.business_state || "",
        addressCountry,
      },
      ...(geoCoordinates && { geo: geoCoordinates }),
    },
    ...ratingBlock,
    offers: classData.options
      ?.filter((opt) =>
        opt.schedules?.some((s) => s.price && parseFloat(s.price) > 0),
      )
      .map((option) => {
        const scheduleWithPrice = option.schedules?.find(
          (s) => s.price && parseFloat(s.price) > 0,
        );
        const inStock =
          scheduleWithPrice &&
          scheduleWithPrice.is_available !== false &&
          scheduleWithPrice.available !== false;
        return {
          "@type": "Offer",
          name: option.title || "Experience Option",
          price:
            scheduleWithPrice?.price || "0",
          priceCurrency: toSchemaPriceCurrency(classData.currency_code),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        };
      }),
  };
}

// Build BreadcrumbList JSON-LD from class + category/location data
function buildBreadcrumbSchema(classData) {
  const base = getSiteUrl();
  const items = [
    { position: 1, name: "Home", item: `${base}/` },
    { position: 2, name: "Explore", item: `${base}/explore` },
  ];
  let position = 3;
  const locationText =
    classData?.business_city && classData?.business_state
      ? `${classData.business_city}, ${classData.business_state}`
      : classData?.business_state || classData?.business_city || null;
  if (locationText) {
    items.push({
      position: position++,
      name: locationText,
      item: `${base}/explore?${new URLSearchParams({ location: locationText }).toString()}`,
    });
  }
  items.push({
    position: position,
    name: classData.title != null ? String(classData.title) : "",
    item: `${base}/classes/${classData.slug}`,
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ position: pos, name, item }) => ({
      "@type": "ListItem",
      position: pos,
      name,
      item,
    })),
  };
}

export default async function ClassPage({ params }) {
  const resolvedParams = await params;
  const { classData, businessData, initialReviews } = await getClassData(
    resolvedParams.slug,
  );

  if (
    classData?.slug &&
    resolvedParams.slug &&
    resolvedParams.slug !== classData.slug
  ) {
    permanentRedirect(`/classes/${classData.slug}`);
  }

  const breadcrumbItems = [
    { key: "home", title: <Link href="/">Home</Link> },
    { key: "explore", title: <Link href="/explore">Explore</Link> },
  ];

  const locationText =
    classData?.business_city && classData?.business_state
      ? `${classData.business_city}, ${classData.business_state}`
      : classData?.business_state || classData?.business_city || null;

  if (locationText) {
    const locationSearchParams = new URLSearchParams({
      location: locationText,
    });
    breadcrumbItems.push({
      key: "location",
      title: (
        <Link href={`/explore?${locationSearchParams.toString()}`}>
          {locationText}
        </Link>
      ),
    });
  }

  breadcrumbItems.push({
    key: "class",
    title:
      classData?.title != null ? String(classData.title) : "Experience",
  });

  const courseSchema = buildCourseSchema(classData, businessData);
  const breadcrumbSchema = buildBreadcrumbSchema(classData);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main style={{ flex: 1 }}>
        <noscript>
          <section
            style={{
              maxWidth: 720,
              margin: "24px auto",
              padding: "0 16px",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.5,
            }}
          >
            <h1 style={{ fontSize: "1.5rem", margin: "0 0 12px" }}>
              {classData?.title != null ? String(classData.title) : "Experience"}
            </h1>
            <p style={{ margin: "0 0 16px", color: "#374151" }}>
              {safeTextSnippet(stripHtmlToText(classData?.description), 800)}
            </p>
            <p style={{ margin: 0 }}>
              <a href={`/classes/${classData.slug}/checkout`}>Continue to booking</a>
            </p>
          </section>
        </noscript>
        <ClassReviewsSeo
          classTitle={
            classData?.title != null ? String(classData.title) : ""
          }
          reviews={initialReviews}
        />
        <ClassPageClient
          classData={classData}
          businessData={businessData}
          initialReviews={initialReviews}
        />
      </main>
      <div
        style={{
          maxWidth: "1200px",
          padding: "24px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "#717171" }}>
          <ol
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              listStyle: "none",
              padding: 0,
              margin: 0,
              alignItems: "center",
            }}
          >
            {breadcrumbItems.map((item, idx) => (
              <li
                key={item.key}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                {idx > 0 ? (
                  <span style={{ color: "#d4d4d4", userSelect: "none" }} aria-hidden>
                    /
                  </span>
                ) : null}
                {item.title}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <FooterSmart />
    </div>
  );
}
