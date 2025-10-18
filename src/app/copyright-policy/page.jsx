import { Suspense } from "react";
import { copyrightPolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import ClientHeader from "@/components/layout/ClientHeader";
import { metadata } from "./metadata";

export { metadata };

const HeaderFallback = () => {
  return (
    <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
  );
};

export default function CopyrightPolicyPage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ClientHeader showOptionsWrapper={false} />
      </Suspense>

      <LegalContent content={copyrightPolicyContent} />
    </>
  );
}
