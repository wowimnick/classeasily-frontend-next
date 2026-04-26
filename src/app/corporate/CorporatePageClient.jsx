"use client";

import FooterClient from "@/components/homepage/FooterClient";
import CorporateAboveFaqRedesign from "./_components/CorporateAboveFaqRedesign";
import CorporateFAQ from "./_components/CorporateFAQ";
import InquiryForm from "./_components/InquiryForm";
import ExploreHeader from "@/components/explore/ExploreHeader";

export default function CorporatePageClient() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ExploreHeader showOptionsWrapper={false} />
      <main>
        <CorporateAboveFaqRedesign />
        <InquiryForm />
        <CorporateFAQ />

      </main>
      {/* FooterClient only: the async Footer server component pulls homepage-content and
          must not live under this client tree (it re-fetches from the browser and can 429). */}
      <FooterClient />
    </div>
  );
}
