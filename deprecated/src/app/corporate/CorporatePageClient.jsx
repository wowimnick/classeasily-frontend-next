import { Suspense } from "react";
import Footer from "@/components/homepage/Footer";
import CorporateAboveFaqRedesign from "./_components/CorporateAboveFaqRedesign";
import CorporateFAQ from "./_components/CorporateFAQ";
import InquiryForm from "./_components/InquiryForm";
import ExploreHeader from "@/components/explore/ExploreHeader";

export default function CorporatePageClient() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ExploreHeader showOptionsWrapper={false} />
      <main>
        <Suspense fallback={<div style={{ minHeight: "520px", background: "#fff" }} aria-hidden />}>
          <CorporateAboveFaqRedesign />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: "420px", background: "#fff" }} aria-hidden />}>
          <InquiryForm />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: "320px", background: "#fff" }} aria-hidden />}>
          <CorporateFAQ />
        </Suspense>
      </main>
      <Suspense fallback={<div style={{ minHeight: "220px", background: "#fff" }} aria-hidden />}>
        <Footer />
      </Suspense>
    </div>
  );
}
