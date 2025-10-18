// --- START OF FILE /src/app/business/help/page.jsx ---

import { Suspense } from "react";
import BusinessHelpArticlePage from "./_components/BusinessHelpArticlePage";
import LoadingFallback from "./_components/LoadingFallback";

// Server Components receive searchParams as a prop
export default function BusinessHelpPage({ searchParams }) {
  const categorySlug = searchParams.category;
  const articleSlug = searchParams.article;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <BusinessHelpArticlePage
        key={`${categorySlug || "default"}-${articleSlug || "none"}`}
        categorySlug={categorySlug}
        articleSlug={articleSlug}
      />
    </Suspense>
  );
}
