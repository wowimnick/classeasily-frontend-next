import dynamic from "next/dynamic";
import SharedMainClientHeader from "@/components/layout/SharedMainClientHeader";
import BannerSearch, {
  AnnouncementBanner,
} from "./(homepage)/_components/BannerSearch";
import { Suspense } from "react";
import "./(homepage)/_components/homepage.css";
import { preloadHomepageData } from "@/lib/server-data-fetchers";
import {
  FindClassSkeleton,
  CategorySkeleton,
} from "./(homepage)/_components/FindClassSkeleton";

const CancellationOverlay = dynamic(() =>
  import("./(homepage)/_components/CancellationOverlay")
);
const InviteOverlay = dynamic(() =>
  import("./(homepage)/_components/InviteOverlay")
);
const PasswordResetOverlay = dynamic(() =>
  import("./(homepage)/_components/PasswordResetOverlay")
);

const ClaimAccountOverlay = dynamic(() =>
  import("./(homepage)/_components/ClaimAccountOverlay")
);

const VerifyEmailOverlay = dynamic(() =>
  import("./(homepage)/_components/VerifyEmailOverlay")
);

// Lazy Load Components
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

const HomepageCategories = dynamic(
  () => import("./(homepage)/_components/HomepageCategories"),
  {
    loading: () => <CategorySkeleton />,
  }
);

const ClassRow = dynamic(() => import("./(homepage)/_components/FindClass"), {
  loading: () => <FindClassSkeleton />,
});

const HowItWorks = dynamic(() => import("./(homepage)/_components/HowItWorks"));
const ForHosts = dynamic(() => import("./(homepage)/_components/ForHosts"));
const Testimonials = dynamic(() =>
  import("./(homepage)/_components/Testimonials")
);
const GiftCardsCTA = dynamic(() =>
  import("./(homepage)/_components/GiftCardsCTA")
);

export const metadata = {
  title: "Classeasily - Find Local Classes & Experiences Near You",
  description: "Discover and book local classes and experiences in your area.",
};

export default async function HomePage() {
  const { row_collections, categories } = await preloadHomepageData();

  return (
    <>
      <AnnouncementBanner />
      <SharedMainClientHeader topOffset={48} />

      <div className="homepage-style">
        <main className="main-content">
          <BannerSearch />

          {/* TRENDING & DATE NIGHT ROWS */}
          {row_collections?.map((collection, index) => (
            <Suspense
              key={collection.slug}
              fallback={
                <FindClassSkeleton
                  style={{ marginTop: index === 0 ? "3rem" : "1rem" }}
                />
              }
            >
              <ClassRow
                title={collection.title}
                subtitle={collection.subtitle}
                classes={collection.classes}
                seeAllLink={`/explore?collection=${collection.slug}`}
                style={{ marginTop: index === 0 ? "3rem" : "0" }}
              />
            </Suspense>
          ))}

          {/* VIBE PILLS (Collections) */}
          <Suspense fallback={<CategorySkeleton />}>
            <HomepageCategories initialCategories={categories} />
          </Suspense>

          <Suspense fallback={<div style={{ minHeight: "800px" }} />}>
            <section id="how-it-works">
              <HowItWorks />
            </section>
          </Suspense>

          <Suspense fallback={<div style={{ minHeight: "400px" }} />}>
            <ForHosts />
          </Suspense>

          <Suspense fallback={<div style={{ minHeight: "600px" }} />}>
            <GiftCardsCTA />
          </Suspense>

          <Suspense fallback={<div style={{ minHeight: "500px" }} />}>
            <Testimonials />
          </Suspense>
        </main>

        <Suspense fallback={<div style={{ minHeight: "300px" }} />}>
          <Footer />
        </Suspense>

        <CancellationOverlay />
        <InviteOverlay />
        <PasswordResetOverlay />
        <ClaimAccountOverlay />
        <VerifyEmailOverlay />
      </div>
    </>
  );
}
