import { Suspense } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { fetchRecentReviews } from "@/lib/server-data-fetchers";
import ReviewsPageClient from "./_components/ReviewsPageClient";
import ReviewsHero from "./_components/ReviewsHero";
import ReviewsCrawlableList from "./_components/ReviewsCrawlableList";

const SITE_URL = "https://classeasily.com";

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const canonical =
    page <= 1 ? `${SITE_URL}/reviews` : `${SITE_URL}/reviews?page=${page}`;

  const title =
    page <= 1
      ? "ClassEasily Reviews | Verified Google Reviews"
      : `ClassEasily Reviews — Page ${page} | Verified Google Reviews`;

  const description =
    "Read verified Google reviews from real class-goers who booked workshops, classes, and local experiences on ClassEasily.";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: [
      "ClassEasily reviews",
      "Google reviews",
      "class reviews",
      "workshop reviews",
      "local experiences reviews",
      "verified reviews",
    ],
    alternates: {
      canonical: page <= 1 ? "/reviews" : `/reviews?page=${page}`,
    },
    openGraph: {
      title,
      description,
      url: page <= 1 ? "/reviews" : `/reviews?page=${page}`,
      siteName: "ClassEasily",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "https://i.imgur.com/biTTckW.png",
          width: 1200,
          height: 630,
          alt: "ClassEasily Reviews",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://i.imgur.com/biTTckW.png"],
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

function buildReviewsJsonLd(initialData, page = 1) {
  const reviews = initialData?.results ?? [];
  const count = initialData?.count ?? reviews.length;
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
      : 4.8;

  const pageUrl =
    page <= 1 ? `${SITE_URL}/reviews` : `${SITE_URL}/reviews?page=${page}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: "ClassEasily Reviews",
      url: pageUrl,
      description:
        "Verified Google reviews from class-goers who booked experiences on ClassEasily.",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "ClassEasily",
        url: SITE_URL,
      },
      breadcrumb: {
        "@id": `${pageUrl}#breadcrumb`,
      },
      mainEntity: {
        "@id": `${SITE_URL}/reviews#organization`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Reviews",
          item: `${SITE_URL}/reviews`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/reviews#organization`,
      name: "ClassEasily",
      url: SITE_URL,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avg.toFixed(1),
        reviewCount: count,
        bestRating: "5",
        worstRating: "1",
      },
      review: reviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: r.reviewer_name || "Google reviewer",
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating ?? 5),
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: r.comment || undefined,
        datePublished: r.review_date || undefined,
        itemReviewed: r.class_slug
          ? {
              "@type": "Course",
              name: r.business_name || "Class on ClassEasily",
              url: `${SITE_URL}/classes/${r.class_slug}`,
            }
          : {
              "@type": "Organization",
              name: "ClassEasily",
            },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Recent ClassEasily Google reviews",
      numberOfItems: reviews.length,
      itemListElement: reviews.map((r, i) => ({
        "@type": "ListItem",
        position: (page - 1) * reviews.length + i + 1,
        url: r.class_slug
          ? `${SITE_URL}/classes/${r.class_slug}`
          : pageUrl,
        name: `${r.reviewer_name || "Reviewer"} — ${r.rating}★ review`,
      })),
    },
  ];
}

/**
 * Inner async component + Suspense: required with cacheComponents so awaiting
 * searchParams does not block the route shell (see blocking-route docs).
 */
async function ReviewsPageContent({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const initialData = await fetchRecentReviews(page, 12);
  const jsonLdBlocks = buildReviewsJsonLd(initialData, page);

  return (
    <>
      {jsonLdBlocks.map((block, i) => (
        <script
          key={`reviews-jsonld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <ReviewsCrawlableList reviews={initialData?.results ?? []} />
      <Suspense fallback={null}>
        <ReviewsPageClient initialData={initialData} initialPage={page} />
      </Suspense>
    </>
  );
}

export default function ReviewsPage({ searchParams }) {
  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <ReviewsHero />
      <Suspense fallback={null}>
        <ReviewsPageContent searchParams={searchParams} />
      </Suspense>
      <Footer />
    </>
  );
}
