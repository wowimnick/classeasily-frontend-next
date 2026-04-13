// src/app/cookie-policy/page.jsx
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { cookiePolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import ExploreHeader from "@/components/explore/ExploreHeader";

export { metadata };

const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default async function CookiePolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>
      <LegalContent content={cookiePolicyContent} />
    </>
  );
}
