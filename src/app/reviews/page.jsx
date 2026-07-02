import { cacheLife } from "next/cache";
import { Suspense } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { fetchRecentReviews } from "@/lib/server-data-fetchers";
import ReviewsPageClient from "./_components/ReviewsPageClient";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "ClassEasily Reviews | Verified Google Reviews",
  description:
    "Read verified Google reviews from real class-goers who booked experiences on ClassEasily. See why thousands trust us for local workshops and activities.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "ClassEasily Reviews | Verified Google Reviews",
    description:
      "Real Google reviews from people who booked classes and experiences through ClassEasily.",
    url: "/reviews",
    siteName: "ClassEasily",
    type: "website",
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
    title: "ClassEasily Reviews",
    description:
      "Verified Google reviews from real class-goers on ClassEasily.",
    images: ["https://i.imgur.com/biTTckW.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function buildReviewsJsonLd(initialData) {
  const reviews = initialData?.results ?? [];
  const count = initialData?.count ?? reviews.length;
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
      : 4.8;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ClassEasily Reviews",
    url: "https://classeasily.com/reviews",
    description:
      "Verified Google reviews from class-goers who booked on ClassEasily.",
    mainEntity: {
      "@type": "Product",
      name: "ClassEasily",
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
        reviewBody: r.comment || "",
        datePublished: r.review_date || undefined,
      })),
    },
  };
}

export default async function ReviewsPage() {
  "use cache";
  cacheLife("max");

  const initialData = await fetchRecentReviews(1, 12);
  const reviewsJsonLd = buildReviewsJsonLd(initialData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }}
      />
      <ExploreHeader showOptionsWrapper={false} />
      <Suspense fallback={null}>
        <ReviewsPageClient initialData={initialData} />
      </Suspense>
      <Footer />
    </>
  );
}
