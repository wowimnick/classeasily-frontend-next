import GiftCardsPage from "./_components/GiftcardPage"; // Adjust path as needed

export const metadata = {
  title: "Buy Digital Gift Cards | Classeasily Experiences",
  description:
    "Give the gift of creativity with Classeasily gift cards. Instant email delivery, no expiration dates, and valid for thousands of workshops and experiences.",
  openGraph: {
    title: "Classeasily Gift Cards",
    description: "The perfect gift for creative people. Instant delivery.",
    url: "https://classeasily.com/giftcards",
    siteName: "Classeasily",
    images: [
      {
        url: "https://classeasily.com/Card%206.png",
        width: 1200,
        height: 630,
        alt: "Classeasily Gift Cards",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://classeasily.com/giftcards",
  },
};

export default function Giftcard() {
  return <GiftCardsPage />;
}
