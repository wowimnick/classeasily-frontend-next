import Link from "next/link";
import MarketingChrome from "@/components/marketing/MarketingChrome";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "About ClassEasily",
  description:
    "ClassEasily is booking and CRM software for small businesses. Embed a widget on your site and manage bookings, capacity, payments, and customers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ClassEasily",
    description:
      "Booking and CRM software for small businesses — easy to set up, priced for small teams.",
    url: "/about",
    siteName: "ClassEasily",
    type: "website",
  },
};

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About ClassEasily",
    url: "https://classeasily.com/about",
    description:
      "ClassEasily is booking and CRM software for small businesses.",
    mainEntity: {
      "@type": "Organization",
      name: "ClassEasily",
      url: "https://classeasily.com",
    },
  };

  return (
    <MarketingChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
          lineHeight: 1.65,
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          About ClassEasily
        </h1>
        <p style={{ marginBottom: "1rem" }}>
          <strong>ClassEasily</strong> is booking and CRM software for small
          businesses. Embed a booking widget on your own site — Wix, Shopify,
          Squarespace, or custom — and manage capacity, payments, and customers
          from one dashboard.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          We started with local studios and still work closely with them. The
          product is built for any appointment-based team that wants to take
          bookings without enterprise software.
        </p>
        <p style={{ marginBottom: "1.5rem" }}>
          <Link href="/pricing">See pricing</Link> or{" "}
          <Link href="/business/register">get started</Link>.
        </p>
      </main>
    </MarketingChrome>
  );
}
