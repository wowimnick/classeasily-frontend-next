// --- START OF FILE /src/app/business/help/page.jsx ---

import { Suspense } from "react";
import BusinessHelpArticlePage from "./_components/BusinessHelpArticlePage";
import LoadingFallback from "./_components/LoadingFallback";

export default function BusinessHelpPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BusinessHelpArticlePage />
    </Suspense>
  );
}
