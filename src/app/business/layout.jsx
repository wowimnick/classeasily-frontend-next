// app/business/layout.js
import {
  metadata as pageMetadata,
  generateFAQStructuredData,
} from "./metadata";

export const metadata = pageMetadata;

export default function BusinessLayout({ children }) {
  const faqStructuredData = generateFAQStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      {children}
    </>
  );
}
