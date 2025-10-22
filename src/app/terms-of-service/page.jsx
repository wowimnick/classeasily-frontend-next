// src/app/terms-of-service/page.jsx
import { Suspense } from "react";
import { termsContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import ExploreHeader from "@/components/explore/ExploreHeader";

export { metadata };

// A simple fallback component to show on the server.
const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default function TermsOfServicePage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>

      <LegalContent content={termsContent} />
    </>
  );
}
