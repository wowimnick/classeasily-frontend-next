import PricingPageClient from "./PricingPageClient";

export const metadata = {
  title: "Pricing",
  description:
    "ClassEasily plans for small businesses: Basic $29, Growth $49, and Advanced $89 per month, plus a small per-booking commission. No setup fee.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "ClassEasily pricing",
    description:
      "Simple monthly plans plus a small commission. Embed a booking widget on your site.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
