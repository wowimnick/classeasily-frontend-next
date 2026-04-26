import { Suspense } from "react";
import dynamic from "next/dynamic";
import { cacheLife } from "next/cache";
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
import HomepageConversationOverlayClient from "./(homepage)/_components/HomepageConversationOverlayClient";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "ClassEasily - Find Local Classes & Experiences Near You",
  description:
    "Discover and book local experiences in your area for your next date night or friend gathering on ClassEasily.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClassEasily - Find Local Classes & Experiences Near You",
    description:
      "Discover and book local experiences in your area for your next date night or friend gathering on ClassEasily.",
    type: "website",
    images: [
      {
        url: "https://i.imgur.com/biTTckW.png",
        width: 1200,
        height: 630,
        alt: "ClassEasily - Discover local experiences",
      },
    ],
  },
};

export default async function HomePage() {
  "use cache";
  cacheLife("homepage");

  // Parallel data fetching
  const { row_collections, categories } = await preloadHomepageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ClassEasily",
    url: "https://classeasily.com",
    description:
      "Discover and book local experiences in your area for your next date night or friend gathering on ClassEasily.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://classeasily.com/explore?query={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is ClassEasily?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ClassEasily is a marketplace to discover and book local workshops, classes, and experiences near you. Guests browse verified hosts; hosts list schedules, take bookings, and get paid through the platform.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find classes near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the search and explore pages on classeasily.com to filter by location, collection, or activity type, then book a session that fits your schedule.",
        },
      },
      {
        "@type": "Question",
        name: "How can I host classes on ClassEasily?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Register your business at classeasily.com/business, complete verification, then create class listings with schedules. ClassEasily handles discovery, booking, and payments.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
        <HomepageConversationOverlayClient />
      </div>
    </>
  );
}
