// src/app/cookie-policy/page.jsx
import { Suspense } from "react";
import { cookiePolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import ClientHeader from "@/components/layout/ClientHeader";

export { metadata };

const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default function CookiePolicyPage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ClientHeader showOptionsWrapper={false} />
      </Suspense>
      <LegalContent content={cookiePolicyContent} />
    </>
  );
}
