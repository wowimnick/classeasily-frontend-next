// components/seo/StructuredData.jsx
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClassEasily",
    url: "https://classeasily.com",
    logo: "https://i.imgur.com/biTTckW.png",
    description:
      "ClassEasily is booking and CRM software for small businesses. Embed a widget on your website and manage bookings, capacity, payments, and customers.",
    sameAs: [
      "https://www.facebook.com/p/ClassEasily-61577902526917/",
      "https://twitter.com/classeasily",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: "English",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ClassEasily",
    url: "https://classeasily.com",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
