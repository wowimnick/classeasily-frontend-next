import dynamic from "next/dynamic";
import SaaSHomePage from "@/components/marketing/SaaSHomePage";

const CancellationOverlay = dynamic(
  () => import("./(homepage)/_components/CancellationOverlay"),
);
const InviteOverlay = dynamic(
  () => import("./(homepage)/_components/InviteOverlay"),
);
const PasswordResetOverlay = dynamic(
  () => import("./(homepage)/_components/PasswordResetOverlay"),
);
const ClaimAccountOverlay = dynamic(
  () => import("./(homepage)/_components/ClaimAccountOverlay"),
);
const VerifyEmailOverlay = dynamic(
  () => import("./(homepage)/_components/VerifyEmailOverlay"),
);

export const metadata = {
  metadataBase: new URL("https://classeasily.com"),
  title: "ClassEasily — Booking and CRM software for small businesses",
  description:
    "Easy to set up, priced for small teams, without the bloat of enterprise tools. Embed a booking widget on your site and manage bookings, capacity, payments, and customers.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "booking software",
    "small business CRM",
    "booking widget",
    "appointment booking",
    "class booking",
    "online payments",
  ],
  openGraph: {
    title: "ClassEasily — Booking and CRM for small businesses",
    description:
      "Embed a booking widget on your site. Manage capacity, payments, and customers from one dashboard.",
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
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a developer to add the widget?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Copy two lines of code from your dashboard and paste them into any page. It works on Wix, Squarespace, Shopify, WordPress, Webflow, and plain HTML.",
      },
    },
    {
      "@type": "Question",
      name: "Can I embed ClassEasily on Wix, Shopify, or Squarespace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste the booking widget on Wix, Shopify, Squarespace, or a custom site. Customers book without leaving your brand.",
      },
    },
    {
      "@type": "Question",
      name: "How much does ClassEasily cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plans start at CAD $29/month plus a small per-booking commission. There is no setup fee.",
      },
    },
    {
      "@type": "Question",
      name: "How long does setup take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create an account, pick a plan, embed the widget — you can take bookings the same day.",
      },
    },
  ],
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClassEasily",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "CAD",
  },
  description:
    "Booking and CRM software for small businesses. Embed a widget on your website and manage bookings, capacity, payments, and customers.",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <SaaSHomePage />
      <CancellationOverlay />
      <InviteOverlay />
      <PasswordResetOverlay />
      <ClaimAccountOverlay />
      <VerifyEmailOverlay />
    </>
  );
}
