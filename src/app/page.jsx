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

// Import Specific Skeletons
import { 
  FindClassSkeleton, 
  CategorySkeleton, 
  TestimonialSkeleton, 
  GiftCardSkeleton 
} from "./(homepage)/_components/FindClassSkeleton";

// Lazy load all homepage components
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ height: "300px", background: "#f9f9f9" }} />,
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
    // Since HowItWorks is a full-screen colored section, a simple placeholder 
    // often looks better than a complex skeleton until it pops in, 
    // but we can add a block loader if preferred.
    loading: () => <div style={{ height: "800px", background: "#f0f0f0" }} />,
  }
);

const ForHosts = dynamic(() => import("./(homepage)/_components/ForHosts"), {
  loading: () => <div style={{ height: "400px", margin: "4rem auto", maxWidth: "1200px", background: "#ffecee", borderRadius: "1.5rem" }} />,
});

const Testimonials = dynamic(
  () => import("./(homepage)/_components/Testimonials"),
  {
    loading: () => <TestimonialSkeleton />,
  }
);

const GiftCardsCTA = dynamic(
  () => import("./(homepage)/_components/GiftCardsCTA"),
  {
    loading: () => <GiftCardSkeleton />,
  }
);

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

export default async function HomePage() {
  const preloadedData = await preloadHomepageData();
  const initialClasses = preloadedData.classes.classes;
  const initialNextPageUrl = preloadedData.classes.nextPageUrl;
  const initialCategories = preloadedData.categories.data;

  const structuredData = generateClassesStructuredData(initialClasses);

  return (
    <>
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
          <BannerSearch />

          <Suspense fallback={<FindClassSkeleton />}>
            <FindClassClientWrapper
              initialClasses={initialClasses}
              initialNextPageUrl={initialNextPageUrl}
            />
          </Suspense>

          <Suspense fallback={<CategorySkeleton />}>
            <HomepageCategories initialCategories={initialCategories} />
          </Suspense>

          <Suspense fallback={<div style={{ height: "800px", background: "#fafafa" }} />}>
            <HowItWorks />
          </Suspense>

          <Suspense fallback={<div style={{ height: "400px", background: "#fff" }} />}>
            <ForHosts />
          </Suspense>

          <Suspense fallback={<GiftCardSkeleton />}>
            <GiftCardsCTA />
          </Suspense>

          <Suspense fallback={<TestimonialSkeleton />}>
            <Testimonials />
          </Suspense>
        </main>

        <Suspense fallback={<div style={{ height: "200px" }} />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
}