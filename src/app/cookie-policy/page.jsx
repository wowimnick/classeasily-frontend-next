// src/app/cookie-policy/page.jsx
import { cacheLife } from "next/cache";
import { cookiePolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import { metadata } from "./metadata";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export { metadata };

export default async function CookiePolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={cookiePolicyContent} />
    </MarketingChrome>
  );
}
