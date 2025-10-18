// app/business/metadata.js
export const metadata = {
  title: "Grow Your Teaching Business | ClassEasily Business Platform",
  description:
    "Join thousands of successful schools, studios, and instructors. Manage classes, reach more students, and increase revenue with our all-in-one business platform.",
  keywords: [
    "teaching business platform",
    "class management software",
    "instructor tools",
    "business growth",
    "online booking system",
    "class scheduling",
    "student management",
  ],
  authors: [{ name: "ClassEasily" }],
  creator: "ClassEasily",
  publisher: "ClassEasily",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://classeasily.com"),
  alternates: {
    canonical: "/business",
  },
  openGraph: {
    title: "Grow Your Teaching Business | ClassEasily Business Platform",
    description:
      "Manage classes, reach more students, and increase revenue with our all-in-one business platform.",
    url: "/business",
    siteName: "ClassEasily",
    images: [
      {
        url: "/assets/social-share-image.jpg",
        width: 1200,
        height: 630,
        alt: "ClassEasily Business Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grow Your Teaching Business | ClassEasily Business Platform",
    description:
      "Manage classes, reach more students, and increase revenue with our all-in-one business platform.",
    images: ["/assets/social-share-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

// Generate FAQ structured data
export function generateFAQStructuredData() {
  const faqData = [
    {
      question: "How does ClassEasily work?",
      answer:
        "ClassEasily is a platform that connects local instructors with students seeking classes in their area. Instructors can list their classes, set their availability, and manage bookings through our intuitive dashboard. Students can search for classes, read reviews, and book sessions directly through the platform with seamless payment processing.",
    },
    {
      question:
        "I'm already working with other online education platforms. Can I work with you, too?",
      answer:
        "Yes, you can certainly work with ClassEasily while maintaining relationships with other platforms. We also offer an exclusive partnership program that comes with benefits like priority placement and dedicated support.",
    },
    {
      question: "What types of classes can I list on ClassEasily?",
      answer:
        "Currently, ClassEasily supports workshop classes only. This includes hands-on, in-person workshops such as art, crafts, cooking, and similar experiences. We are expanding to other categories soon!",
    },
    {
      question: "How do payments and fees work on ClassEasily?",
      answer:
        "We handle all payments through our secure platform (Stripe). Funds are transferred to your account after the class is completed, minus our transparent, all-inclusive 20% service fee. This fee covers all platform costs, including marketing, payment processing, and 24/7 support.",
    },
    {
      question: "Is ClassEasily available in my area?",
      answer:
        "ClassEasily is rapidly expanding. To check if we're available in your area, simply enter your location on our homepage. If we're not there yet, you can join our waitlist to be the first to know when we launch.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}