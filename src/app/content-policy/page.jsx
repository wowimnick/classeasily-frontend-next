// src/app/content-policy/page.jsx

import { Suspense } from "react"; // Add this
import { contentPolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import ClientHeader from "@/components/layout/ClientHeader";

export { metadata };

const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default function ContentPolicyPage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ClientHeader showOptionsWrapper={false} />
      </Suspense>
      <LegalContent content={contentPolicyContent} />
    </>
  );
}
