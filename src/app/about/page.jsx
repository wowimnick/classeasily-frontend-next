import { cacheLife } from "next/cache";
import Link from "next/link";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "About ClassEasily | Local Classes & Experiences",
  description:
    "ClassEasily helps you discover and book local workshops and experiences, and gives hosts tools to grow. Learn what we do and who we serve.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About ClassEasily",
    description:
      "A marketplace for local workshops and experiences—built for guests who love to learn and hosts who love to teach.",
    url: "/about",
    siteName: "ClassEasily",
    type: "website",
    images: [
      {
        url: "https://i.imgur.com/biTTckW.png",
        width: 1200,
        height: 630,
        alt: "ClassEasily",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About ClassEasily",
    description:
      "Discover local classes, book experiences, and grow your teaching business on one platform.",
    images: ["https://i.imgur.com/biTTckW.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function AboutPage() {
  "use cache";
  cacheLife("max");

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About ClassEasily",
    url: "https://classeasily.com/about",
    description:
      "ClassEasily connects guests with local workshops and experiences and provides hosts with listing, booking, and payment tools.",
    mainEntity: {
      "@type": "Organization",
      name: "ClassEasily",
      url: "https://classeasily.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <ExploreHeader showOptionsWrapper={false} />
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
          <strong>ClassEasily</strong> is a marketplace for local workshops,
          classes, and experiences—from pottery and glassblowing to cooking,
          fitness, and creative nights out. We help people find memorable things
          to do nearby and make it easy to book with trusted hosts.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          For instructors, studios, and small businesses, ClassEasily offers
          tools to list experiences, manage schedules, take bookings, and reach
          new students. Our goal is to support independent hosts with fair,
          transparent pricing and a smooth experience for both sides.
        </p>
        <p style={{ marginBottom: "1.5rem" }}>
          Ready to explore? Start at{" "}
          <Link href="/explore">Explore</Link> or learn about hosting on{" "}
          <Link href="/business">ClassEasily for business</Link>.
        </p>
      </main>
      <Footer />
    </>
  );
}
