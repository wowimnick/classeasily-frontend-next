import { Suspense } from "react";
import CorporatePageGate from "./CorporatePageGate";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "Team building & corporate experiences | ClassEasily",
  description:
    "Curated team workshops and group experiences for offsites, ERGs, and client events. Scroll-driven storytelling, simple inquiry, and hosts your People team can trust.",
  alternates: {
    canonical: "/corporate",
  },
  openGraph: {
    title: "Team building & corporate experiences | ClassEasily",
    description:
      "Curated team workshops and group experiences for offsites, ERGs, and client events.",
    type: "website",
    url: "https://classeasily.com/corporate",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ClassEasily for Teams",
    url: "https://classeasily.com/corporate",
    description:
      "Corporate and team-building experiences powered by ClassEasily’s marketplace of trusted local hosts.",
    isPartOf: {
      "@type": "WebSite",
      name: "ClassEasily",
      url: "https://classeasily.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClassEasily",
    url: "https://classeasily.com",
    description:
      "Marketplace for memorable in-person classes and workshops hosted by local businesses.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "ClassEasily corporate team experiences",
    serviceType: "Corporate team building and group workshop planning",
    provider: {
      "@type": "Organization",
      name: "ClassEasily",
      url: "https://classeasily.com",
    },
    areaServed: {
      "@type": "Country",
      name: "US",
    },
    url: "https://classeasily.com/corporate",
  },
];

export default function CorporatePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", background: "#fff" }} aria-hidden />
        }
      >
        <CorporatePageGate />
      </Suspense>
    </>
  );
}
