import dynamic from "next/dynamic";
import SharedMainClientHeader from "@/components/layout/SharedMainClientHeader";
import BannerSearch from "./(homepage)/_components/BannerSearch";
import { Suspense } from "react";
import "./(homepage)/_components/homepage.css";
import {
  preloadHomepageData,
  generateClassesStructuredData,
} from "@/lib/server-data-fetchers";
import FindClassClientWrapper from "./(homepage)/_components/FindClassClientWrapper";

// Lazy load all homepage components for optimal performance
// This ensures ZERO blocking time by loading non-critical sections after initial paint
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

const HomepageCategories = dynamic(
  () => import("./(homepage)/_components/HomepageCategories"),
  {
    loading: () => <CategorySkeleton />,
  }
);

const HowItWorks = dynamic(
  () => import("./(homepage)/_components/HowItWorks"),
  {
    loading: () => <div style={{ minHeight: "800px" }} />,
  }
);

const ForHosts = dynamic(() => import("./(homepage)/_components/ForHosts"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
});

const Testimonials = dynamic(
  () => import("./(homepage)/_components/Testimonials"),
  {
    loading: () => <div style={{ minHeight: "500px" }} />,
  }
);

const GiftCardsCTA = dynamic(
  () => import("./(homepage)/_components/GiftCardsCTA"),
  {
    loading: () => <div style={{ minHeight: "600px" }} />,
  }
);

// Skeleton Components (Server Components)
function SectionSkeleton() {
  return (
    <div className="section-skeleton-container">
      <div className="skeleton-title" />
      <div className="skeleton-block" style={{ width: "70%" }} />
      <div className="skeleton-block" style={{ width: "75%" }} />
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="category-skeleton-container">
      {[...Array(6)].map((_, i) => (
        <div className="skeleton-category-card" key={i}>
          <div className="skeleton-circle" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}

// Metadata export for SEO
export const metadata = {
  title: "Classeasily - Find Local Classes & Workshops Near You",
  description:
    "Discover and book local classes and workshops in your area. Join a community of learners and hosts today!",
  openGraph: {
    title: "Classeasily - Find Local Classes & Workshops Near You",
    description: "Discover and book local classes and workshops in your area.",
    url: "https://classeasily.com",
    siteName: "Classeasily",
    images: [
      {
        url: "https://classeasily.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Classeasily - Find Local Classes & Workshops Near You",
    description: "Discover and book local classes and workshops in your area.",
    images: ["https://classeasily.com/twitter-image.jpg"],
  },
  alternates: {
    canonical: "https://classeasily.com",
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Classeasily",
        url: "https://classeasily.com",
        logo: "https://classeasily.com/logo.png",
        sameAs: [
          "https://facebook.com/classeasily",
          "https://linkedin.com/company/classeasily",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Classeasily",
        url: "https://classeasily.com",
        potentialAction: {
          "@type": "SearchAction",
          target:
            "https://classeasily.com/explore?keyword={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ]),
  },
};

/**
 * Server Component with SSR data fetching
 * Fetches data on the server for SEO and performance
 */
export default async function HomePage() {
  // Use the new, efficient preload function to fetch data in parallel
  const preloadedData = await preloadHomepageData();

  // Extract the actual arrays of data from the results
  const initialClasses = preloadedData.classes.classes;
  const initialNextPageUrl = preloadedData.classes.nextPageUrl;
  const initialCategories = preloadedData.categories.data; // Correctly access the .data property

  // Generate structured data for SEO rich results
  const structuredData = generateClassesStructuredData(initialClasses);

  return (
    <>
      {/* Inject structured data for SEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      <SharedMainClientHeader />

      <div className="homepage-style">
        <main className="main-content">
          {/* Above the fold - render immediately */}
          <BannerSearch />

          {/* Pass the correctly extracted data to the client component */}
          <Suspense fallback={<CategorySkeleton />}>
            <FindClassClientWrapper
              initialClasses={initialClasses}
              initialNextPageUrl={initialNextPageUrl}
            />
          </Suspense>

          {/* Pass the correctly extracted data to the categories component */}
          <Suspense fallback={<CategorySkeleton />}>
            <HomepageCategories initialCategories={initialCategories} />
          </Suspense>

          {/* How It Works section - lazy loaded, static content */}
          <Suspense fallback={<div style={{ minHeight: "800px" }} />}>
            <HowItWorks />
          </Suspense>

          {/* For Hosts section - lazy loaded, static content */}
          <Suspense fallback={<div style={{ minHeight: "400px" }} />}>
            <ForHosts />
          </Suspense>

          {/* Gift Cards CTA - lazy loaded, interactive content */}
          <Suspense fallback={<div style={{ minHeight: "600px" }} />}>
            <GiftCardsCTA />
          </Suspense>

          {/* Testimonials section - lazy loaded, static content */}
          <Suspense fallback={<div style={{ minHeight: "500px" }} />}>
            <Testimonials />
          </Suspense>
        </main>

        {/* Footer - lazy loaded, lowest priority */}
        <Suspense fallback={<div style={{ minHeight: "300px" }} />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
}
