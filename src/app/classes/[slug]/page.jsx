import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  fetchClassDetail,
  fetchBusinessDetail,
  fetchClassReviews,
} from "@/lib/server-data-fetchers";
import FooterSmart from "@/components/homepage/FooterSmart.jsx";
import ClassPageClient from "../_components/ClassPageClient";
import ClassReviewsSeo from "../_components/ClassReviewsSeo";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** API may return non-strings; metadata + JSON-LD must not call string methods blindly. */
function safeTextSnippet(value, maxLen) {
  if (value == null) return "";
  const s = String(value);
  if (!s.trim()) return "";
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}...`;
}

/** DRF may serialize Decimals as strings; `.toFixed` only exists on numbers. */
function formatRatingOneDecimal(value) {
  if (value == null || value === "") return "0";
  const n = typeof value === "number" ? value : parseFloat(String(value), 10);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1);
}

// Generate static params - fetch ALL classes
export async function generateStaticParams() {
  try {
    console.log("=== Fetching ALL experience slugs for static generation ===");
    const allClasses = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      try {
        console.log(`Fetching page ${page}...`);

        const response = await fetch(
          `${BASE_URL}/classes/?page=${page}&page_size=100`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) {
          console.error(`Failed to fetch page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json();

        if (data.results && Array.isArray(data.results)) {
          allClasses.push(...data.results);
          console.log(
            `✅ Page ${page}: Added ${data.results.length} experiences`,
          );
          hasMore = !!data.next;
          page++;
        } else {
          hasMore = false;
        }

        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    const slugs = allClasses
      .filter((classItem) => classItem.slug)
      .map((classItem) => ({ slug: classItem.slug }));

    console.log(
      `=== ✅ SUCCESS: ${slugs.length} experience pages will be pre-generated ===`,
    );
    // Next.js 16 (Cache Components) requires at least one result from generateStaticParams.
    if (slugs.length === 0) {
      console.warn("No slugs from API; returning placeholder so build can succeed.");
      return [{ slug: "__build_placeholder" }];
    }
    return slugs;
  } catch (error) {
    console.error("❌ Error in generateStaticParams:", error);
    // Return one placeholder so build succeeds when API is down (e.g. ECONNREFUSED).
    return [{ slug: "__build_placeholder" }];
  }
}

// UPDATED: Fetch class data with proper tagged business fetch
async function getClassData(slug) {
  console.log(`=== Fetching data for slug: ${slug} ===`);

  if (!slug) {
    console.error("ERROR: slug is undefined or empty!");
    notFound();
  }

  try {
    // USE THE FUNCTION WITH CACHE TAGS
    const classResult = await fetchClassDetail(slug);

    if (!classResult.success || !classResult.data) {
      console.warn(`Experience not found for slug: ${slug}`);
      notFound();
    }

    const classData = classResult.data;
    console.log(`✅ Experience data fetched: ${classData.classId}`);

    // Fetch business and reviews in parallel via lib server fetchers (cached)
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
  } catch (error) {
    console.error(`❌ ERROR in getClassData for ${slug}:`, error);

    if (
      error.response?.status === 404 ||
      error.message?.includes("404") ||
      error.message?.includes("not found")
    ) {
      notFound();
    }

    throw error;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const { classData, businessData } = await getClassData(resolvedParams.slug);

  const pageTitle = classData?.title
    ? `${String(classData.title)} | ClassEasily`
    : "Experience Details | ClassEasily";
  const pageDescription =
    safeTextSnippet(classData?.description, 160) ||
    "View details and book this experience for your next date night or friend gathering on ClassEasily.";
  const canonicalUrl = `https://classeasily.com/classes/${classData.slug}`;
  const imageUrl =
    classData.images?.length > 0
      ? classData.images[0].medium_url || classData.images[0].original_url
      : "https://classeasily.com/placeholder-image.jpg";

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
  const imageUrl =
    classData.images?.length > 0
      ? classData.images[0].medium_url || classData.images[0].original_url
      : "https://classeasily.com/placeholder-image.jpg";
  let geoCoordinates = null;
  if (classData.coordinates != null && typeof classData.coordinates === "string") {
    const parts = classData.coordinates.split(",");
    if (parts.length === 2) {
      const lat = parts[0].trim();
      const lng = parts[1].trim();
      if (lat && lng) {
        geoCoordinates = {
          "@type": "GeoCoordinates",
          latitude: lat,
          longitude: lng,
        };
      }
    }
  }
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
      url: businessData?.website || "https://classeasily.com",
    },
    location: {
      "@type": "Place",
      name: businessData?.businessName || "Event Location",
      address: {
        "@type": "PostalAddress",
        streetAddress: classData.location || "",
        addressLocality: classData.business_city || "",
        addressRegion: classData.business_state || "",
        addressCountry: "CA",
      },
      ...(geoCoordinates && { geo: geoCoordinates }),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: formatRatingOneDecimal(classData.average_rating),
      reviewCount: String(classData.review_count ?? "0"),
    },
    offers: classData.options
      ?.filter((opt) =>
        opt.schedules?.some((s) => s.price && parseFloat(s.price) > 0),
      )
      .map((option) => ({
        "@type": "Offer",
        name: option.title || "Experience Option",
        price:
          option.schedules?.find((s) => s.price && parseFloat(s.price) > 0)
            ?.price || "0",
        priceCurrency: classData.currency_code || "USD",
        availability: "https://schema.org/InStock",
      })),
  };
}

// Build BreadcrumbList JSON-LD from class + category/location data
function buildBreadcrumbSchema(classData) {
  const base = "https://classeasily.com";
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
  const resolvedParams = await Promise.resolve(params);
  const { classData, businessData, initialReviews } = await getClassData(
    resolvedParams.slug,
  );

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
