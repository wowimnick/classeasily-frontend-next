import { Suspense } from "react";
import dynamic from "next/dynamic";
import { preloadHomepageData } from "@/lib/server-data-fetchers";
import "./(homepage)/_components/homepage.css";

import BannerSearch from "./(homepage)/_components/BannerSearch";
import SharedMainClientHeader from "@/components/layout/SharedMainClientHeader";
import { HomepageCategoriesFallback } from "./(homepage)/_components/HomepageCategories";
import BannerSearchClient from "./(homepage)/_components/BannerSearchClient";
import { FindClassSkeleton } from "./(homepage)/_components/FindClassSkeleton";

// --- CLIENT COMPONENTS (Lazy Loaded) ---

// Categories Carousel
const HomepageCategories = dynamic(
  () => import("./(homepage)/_components/HomepageCategories"),
  {},
);

// Class Rows (Carousels)
const FindClassClientWrapper = dynamic(
  () => import("./(homepage)/_components/FindClassClientWrapper"),
  {
    loading: () => <FindClassSkeleton />,
  },
);

// Below-fold sections
const HowItWorks = dynamic(
  () => import("./(homepage)/_components/HowItWorks"),
  { loading: () => <div style={{ height: "600px" }} /> },
);

const GiftCardsCTA = dynamic(
  () => import("./(homepage)/_components/GiftCardsCTA"),
  { loading: () => <div style={{ height: "500px" }} /> },
);

import ForHostsClient from "./(homepage)/_components/ForHostsClient";

const Testimonials = dynamic(
  () => import("./(homepage)/_components/Testimonials"),
  { loading: () => <div style={{ height: "400px" }} /> },
);

const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ height: "300px" }} />,
});

// Overlays (Client logic only)
const CancellationOverlay = dynamic(
  () => import("./(homepage)/_components/CancellationOverlay"),
);
const InviteOverlay = dynamic(
  () => import("./(homepage)/_components/InviteOverlay"),
);
const PasswordResetOverlay = dynamic(
  () => import("./(homepage)/_components/PasswordResetOverlay"),
);
const ClaimAccountOverlay = dynamic(
  () => import("./(homepage)/_components/ClaimAccountOverlay"),
);
const VerifyEmailOverlay = dynamic(
  () => import("./(homepage)/_components/VerifyEmailOverlay"),
);

export const metadata = {
  title: "ClassEasily - Find Local Classes & Experiences Near You",
  description:
    "Discover and book local experiences in your area for your next date night or friend gathering on Classeasily.",
  openGraph: {
    title: "ClassEasily - Find Local Classes & Experiences Near You",
    description:
      "Discover and book local experiences in your area for your next date night or friend gathering on Classeasily.",
    type: "website",
  },
};

export default async function HomePage() {
  // Parallel data fetching
  const { row_collections, categories } = await preloadHomepageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ClassEasily",
    url: "https://classeasily.com",
    description:
      "Discover and book local experiences in your area for your next date night or friend gathering on Classeasily.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://classeasily.com/explore?query={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="homepage-style">
        <main className="main-content">
          <BannerSearchClient mode="announcement" />
          <SharedMainClientHeader topOffset={48} />

          <BannerSearch />

          {row_collections?.map((collection) => (
            <Suspense key={collection.title} fallback={<FindClassSkeleton />}>
              <FindClassClientWrapper
                title={collection.title}
                subtitle={collection.subtitle}
                initialClasses={collection.classes}
                seeAllLink={collection.seeAllLink || "/explore"}
              />
            </Suspense>
          ))}

          <Suspense
            fallback={<HomepageCategoriesFallback categories={categories} />}
          >
            <HomepageCategories initialCategories={categories} />
          </Suspense>

          <section id="how-it-works">
            <Suspense fallback={<div style={{ height: "600px" }} />}>
              <HowItWorks />
            </Suspense>
          </section>

          <Suspense fallback={<div style={{ height: "500px" }} />}>
            <GiftCardsCTA />
          </Suspense>

          <Suspense fallback={<div style={{ height: "500px" }} />}>
            <ForHostsClient />
          </Suspense>

          <Suspense fallback={<div style={{ height: "400px" }} />}>
            <Testimonials />
          </Suspense>
        </main>

        <Suspense fallback={<div style={{ height: "300px" }} />}>
          <Footer />
        </Suspense>

        {/* Global Overlays - Loaded only when needed logic triggers */}
        <CancellationOverlay />
        <InviteOverlay />
        <PasswordResetOverlay />
        <ClaimAccountOverlay />
        <VerifyEmailOverlay />
      </div>
    </>
  );
}
