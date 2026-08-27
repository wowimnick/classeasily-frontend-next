import { cacheLife } from "next/cache";
import { copyrightPolicyContent } from "../_legalcomponents/legalPagesContent";
import LegalContent from "../_legalcomponents/LegalContent";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import { metadata } from "./metadata";

export { metadata };

export default async function CopyrightPolicyPage() {
  "use cache";
  cacheLife("max");

  return (
    <MarketingChrome>
      <LegalContent content={copyrightPolicyContent} />
    </MarketingChrome>
  );
}
