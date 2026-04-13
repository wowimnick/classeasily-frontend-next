import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { copyrightPolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import ExploreHeader from "@/components/explore/ExploreHeader";

import { metadata } from "./metadata";

export { metadata };

const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default async function CopyrightPolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>

      <LegalContent content={copyrightPolicyContent} />
    </>
  );
}
