"use client";

import MarketingHeader, { MarketingHeaderSpacer } from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

export default function MarketingChrome({ children }) {
  return (
    <>
      <MarketingHeader />
      <MarketingHeaderSpacer />
      {children}
      <MarketingFooter />
    </>
  );
}
