// src/app/content-policy/page.jsx
import { cacheLife } from "next/cache";
import { contentPolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export { metadata };

export default async function ContentPolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={contentPolicyContent} />
    </MarketingChrome>
  );
}
