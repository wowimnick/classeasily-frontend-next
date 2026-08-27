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

export function LocalBusinessSchema({ business }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    image: business.image,
    description: business.description,
    "@id": business.url,
    url: business.url,
    telephone: business.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address?.street,
      addressLocality: business.address?.city,
      addressRegion: business.address?.state,
      postalCode: business.address?.zipCode,
      addressCountry: "US",
    },
    geo: business.coordinates
      ? {
          "@type": "GeoCoordinates",
          latitude: business.coordinates.lat,
          longitude: business.coordinates.lng,
        }
      : undefined,
    aggregateRating: business.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: business.rating.average,
          reviewCount: business.rating.count,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CourseSchema({ course }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: course.provider,
      sameAs: course.providerUrl,
    },
    offers: {
      "@type": "Offer",
      price: course.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: course.url,
      validFrom: course.startDate,
    },
    image: course.image,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.mode || "offline",
      location: course.location
        ? {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: course.location.city,
              addressRegion: course.location.state,
            },
          }
        : undefined,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
