// src/app/privacy-policy/page.jsx
import { cacheLife } from "next/cache";
import { privacyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export { metadata };

export default async function PrivacyPolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={privacyContent} />
    </MarketingChrome>
  );
}
