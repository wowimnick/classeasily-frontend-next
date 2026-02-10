// app/business/layout.jsx
import {
  metadata as pageMetadata,
  generateFAQStructuredData,
} from "./metadata";
import ClientOnlyWrapper from "@/components/common/ClientOnlyWrapper";

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
      <ClientOnlyWrapper>{children}</ClientOnlyWrapper>
    </>
  );
}
