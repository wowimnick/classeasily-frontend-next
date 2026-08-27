// src/app/terms-of-service/page.jsx
import { cacheLife } from "next/cache";
import { termsContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export { metadata };

export default async function TermsOfServicePage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={termsContent} />
    </MarketingChrome>
  );
}
