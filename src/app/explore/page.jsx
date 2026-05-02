import { Suspense } from "react";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import {
  searchClasses,
  fetchExploreCollectionLists,
} from "@/lib/server-data-fetchers";
import ExplorePageSkeleton from "./_components/ExplorePageSkeleton";

function getExploreMeta(resolvedSearchParams) {
  const collection = resolvedSearchParams?.collection;
  const location = resolvedSearchParams?.location;
  let title = "Explore Experiences Near You | ClassEasily";
  let description =
    "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!";

  const collectionText = collection
    ? collection.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  if (collectionText && location) {
    title = `${collectionText} Experiences in ${location} | ClassEasily`;
    description = `Discover the best ${collectionText.toLowerCase()} experiences and activities in ${location}. Book your spot today!`;
  } else if (location) {
    title = `Experiences and Activities in ${location} | ClassEasily`;
    description = `Explore a wide variety of experiences in ${location}. From art to cooking, find your next great memory.`;
  } else if (collectionText) {
    title = `Explore ${collectionText} Experiences | ClassEasily`;
    description = `Find and book the best ${collectionText.toLowerCase()} experiences and activities in your area.`;
  }
  return { title, description };
}

function buildExploreBreadcrumbSchema(searchParams) {
  const base = "https://classeasily.com";
  const items = [
    { position: 1, name: "Home", item: `${base}/` },
    { position: 2, name: "Explore", item: `${base}/explore` },
  ];
  let position = 3;
  const location = searchParams?.location;
  const collection = searchParams?.collection;
  const tag = searchParams?.tag;
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (location) {
    items.push({
      position: position++,
      name: location.split(",")[0].trim(),
      item: `${base}/explore?${params.toString()}`,
    });
  }
  if (collection) {
    if (location) params.set("location", location);
    params.set("collection", collection);
    items.push({
      position: position++,
      name: collection.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${base}/explore?${params.toString()}`,
    });
  }
  if (tag && !collection) {
    if (location) params.set("location", location);
    params.set("tag", tag);
    items.push({
      position: position++,
      name: tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${base}/explore?${params.toString()}`,
    });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ position: pos, name, item }) => ({
      "@type": "ListItem",
      position: pos,
      name,
      item,
    })),
  };
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { title, description } = getExploreMeta(resolvedSearchParams);

  const collection = resolvedSearchParams?.collection;
  const location = resolvedSearchParams?.location;
  const canonicalParams = new URLSearchParams();
  if (collection) canonicalParams.set("collection", collection);
  if (location) canonicalParams.set("location", location);
  const queryString = canonicalParams.toString();
  const canonicalUrl = `https://classeasily.com/explore${queryString ? `?${queryString}` : ""}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "ClassEasily",
      images: [
        {
          url: "https://i.imgur.com/biTTckW.png",
          width: 1200,
          height: 630,
          alt: "ClassEasily - Discover Local Experiences",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://i.imgur.com/biTTckW.png"],
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
  };
}

async function fetchServerData(searchParams) {
  const apiParams = {};

  const latFromUrl = searchParams.lat;
  const lngFromUrl = searchParams.lng;
  const locationDisplayNameFromUrl = searchParams.location;

  if (latFromUrl && lngFromUrl) {
    apiParams.lat = parseFloat(latFromUrl);
    apiParams.lng = parseFloat(lngFromUrl);
  }

  if (locationDisplayNameFromUrl) {
    apiParams.location_search = locationDisplayNameFromUrl;
  }

  const collection = searchParams.collection;
  if (collection) {
    apiParams.collection = collection;
  }

  // Handle all other search params
  if (searchParams.tag) apiParams.tag = searchParams.tag;
  if (searchParams.keyword) apiParams.keyword = searchParams.keyword;
  if (searchParams.price_min)
    apiParams.price_min = parseInt(searchParams.price_min, 10);
  if (searchParams.price_max)
    apiParams.price_max = parseInt(searchParams.price_max, 10);
  if (searchParams.radius) apiParams.radius = parseInt(searchParams.radius, 10);

  // UPDATED: Handle Date Range
  if (searchParams.start_date) apiParams.start_date = searchParams.start_date;
  if (searchParams.end_date) apiParams.end_date = searchParams.end_date;
  if (searchParams.date) apiParams.date = searchParams.date;

  if (searchParams.participants)
    apiParams.participants = parseInt(searchParams.participants, 10);
  if (searchParams.sort_by && searchParams.sort_by !== "relevance") {
    apiParams.sort_by = searchParams.sort_by;
  }

  // Handle time preferences and days
  const timePrefs = searchParams.time_preference;
  if (timePrefs) {
    apiParams.time_preference = Array.isArray(timePrefs)
      ? timePrefs
      : [timePrefs];
  }

  const days = searchParams.days;
  if (days) {
    apiParams.days = Array.isArray(days) ? days : [days];
  }

  // Removed console.log for production performance

  const [classesResponse, collectionLists] = await Promise.all([
    searchClasses(apiParams),
    fetchExploreCollectionLists(),
  ]);

  return {
    categories: [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    locationName: locationDisplayNameFromUrl || "",
    collections: collectionLists.collections || [],
    collectionsIWant: collectionLists.collectionsIWant || [],
    routeParams: {
      province: null,
      city: null,
      identifier: null,
    },
  };
}

function generateStructuredData(classes, locationName) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Experiences and Activities${locationName ? ` in ${locationName}` : ""}`,
    description: `Find local experiences and activities${
      locationName ? ` in ${locationName}` : ""
    }`,
    numberOfItems: classes.length,
    itemListElement: classes.slice(0, 10).map((classItem, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: classItem.title,
        description: classItem.description || classItem.title,
        provider: {
          "@type": "Organization",
          name: classItem.business_name || "ClassEasily Host",
        },
        url: `https://classeasily.com/classes/${classItem.slug}`,
        ...(classItem.average_rating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: classItem.average_rating,
            reviewCount: classItem.review_count,
          },
        }),
        ...(classItem.min_session_price && {
          offers: {
            "@type": "Offer",
            price: classItem.min_session_price,
            priceCurrency: "USD",
          },
        }),
      },
    })),
  };
}

async function ExplorePageContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const serverData = await fetchServerData(resolvedSearchParams);
  const structuredData = generateStructuredData(
    serverData.initialClasses,
    serverData.locationName,
  );
  const breadcrumbSchema = buildExploreBreadcrumbSchema(resolvedSearchParams);
  const { title: pageTitle } = getExploreMeta(resolvedSearchParams);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <h1
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {pageTitle}
      </h1>
      <ExploreClient
        initialCategories={serverData.categories}
        initialClasses={serverData.initialClasses}
        initialTotalCount={serverData.totalCount}
        initialNextPageUrl={serverData.nextPageUrl}
        initialCollections={serverData.collections}
        initialCollectionsIWant={serverData.collectionsIWant}
        routeParams={serverData.routeParams}
      />
    </>
  );
}

export default async function ExploreRootPage(props) {
  return (
    <Suspense fallback={<ExplorePageSkeleton />}>
      <ExplorePageContent searchParams={props.searchParams} />
    </Suspense>
  );
}
