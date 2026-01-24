// components/seo/StructuredData.jsx
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Classeasily",
    url: "https://classeasily.com",
    logo: "https://i.imgur.com/biTTckW.png",
    description:
      "Classeasily is a platform designed to help find the best experiences and activities in the area. We offer a wide range of options, from workshops to fun and engaging events, all tailored to make your time enjoyable and memorable. Whether you're looking for a fun activity to do with friends or family, or just want to explore new experiences, Classeasily has got you covered.",
    sameAs: [
      // Add your social media profiles
      // "https://facebook.com/classeasily",
      // "https://twitter.com/classeasily",
      // "https://linkedin.com/company/classeasily"
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
    name: "Classeasily",
    url: "https://classeasily.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://classeasily.com/explore?keyword={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
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
