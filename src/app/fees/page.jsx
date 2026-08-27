// src/app/fees/page.jsx
import { cacheLife } from "next/cache";
import { feeContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export { metadata };

export default async function FeesPage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={feeContent} />
    </MarketingChrome>
  );
}
