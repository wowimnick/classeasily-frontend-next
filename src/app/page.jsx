import dynamic from "next/dynamic";
import SharedMainClientHeader from "@/components/layout/SharedMainClientHeader";
import BannerSearch, { AnnouncementBanner } from "./(homepage)/_components/BannerSearch";
import { Suspense } from "react";
import "./(homepage)/_components/homepage.css";
import { preloadHomepageData } from "@/lib/server-data-fetchers";
import { FindClassSkeleton, CategorySkeleton } from "./(homepage)/_components/FindClassSkeleton";

const CancellationOverlay = dynamic(() => import("./(homepage)/_components/CancellationOverlay"));

// Lazy Load Components
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

const HomepageCategories = dynamic(() => import("./(homepage)/_components/HomepageCategories"), {
  loading: () => <CategorySkeleton />,
});

const ClassRow = dynamic(() => import("./(homepage)/_components/FindClass"), {
  loading: () => <FindClassSkeleton />,
});

const HowItWorks = dynamic(() => import("./(homepage)/_components/HowItWorks"));
const ForHosts = dynamic(() => import("./(homepage)/_components/ForHosts"));
const Testimonials = dynamic(() => import("./(homepage)/_components/Testimonials"));
const GiftCardsCTA = dynamic(() => import("./(homepage)/_components/GiftCardsCTA"));

export const metadata = {
  title: "Classeasily - Find Local Classes & Workshops Near You",
  description: "Discover and book local classes and workshops in your area.",
};

export default async function HomePage() {
  const { trending, newClasses, featuredCategory, categories } = await preloadHomepageData();

  return (
    <>
      <AnnouncementBanner />
      <SharedMainClientHeader topOffset={48} />

      <div className="homepage-style">
        <main className="main-content">
          <BannerSearch />

          <Suspense fallback={<FindClassSkeleton style={{ marginTop: "3rem" }} />}>
            <ClassRow
              title="Trending this Week"
              subtitle="Most booked classes by people near you"
              classes={trending}
              seeAllLink="/explore?sort=popularity"
              style={{ marginTop: "3rem" }}
            />
          </Suspense>

          <Suspense fallback={<FindClassSkeleton />}>
            <ClassRow
              title="New & Noteworthy"
              subtitle="Just added classes you shouldn't miss"
              classes={newClasses}
              seeAllLink="/explore?sort=newest"
            />
          </Suspense>

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
      </div>
    </>
  );
}