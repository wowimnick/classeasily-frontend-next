import { Suspense } from "react";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import {
  searchClasses,
  fetchExploreCollectionLists,
} from "@/lib/server-data-fetchers";
import ExplorePageSkeleton from "./_components/ExplorePageSkeleton";
import {
  exploreSearchParamsToString,
  getDefaultOgImageUrl,
  getSiteUrl,
  normalizeExploreCollectionSlugs,
  toSchemaPriceCurrency,
} from "@/lib/seo";

function getExploreMeta(resolvedSearchParams) {
  const collectionSlugs = normalizeExploreCollectionSlugs(
    resolvedSearchParams?.collection,
  );
  const location = resolvedSearchParams?.location;
  let title = "Explore Experiences Near You | ClassEasily";
  let description =
    "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!";

  const primarySlug = collectionSlugs[0];
  const collectionText = primarySlug
    ? primarySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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
  const site = getSiteUrl();
  const sp = searchParams && typeof searchParams === "object" ? { ...searchParams } : {};
  const items = [
    { position: 1, name: "Home", item: `${site}/` },
    { position: 2, name: "Explore", item: `${site}/explore` },
  ];
  let position = 3;
  const location = sp?.location;
  const collectionSlugs = normalizeExploreCollectionSlugs(sp?.collection);
  const tag = sp?.tag;
  if (location) {
    const p = { ...sp };
    p.location = location;
    items.push({
      position: position++,
      name: String(location).split(",")[0].trim(),
      item: `${site}/explore${exploreSearchParamsToString(p)}`,
    });
  }
  if (collectionSlugs.length) {
    const p = { ...sp };
    p.collection =
      collectionSlugs.length === 1 ? collectionSlugs[0] : collectionSlugs;
    const fmt = (s) =>
      String(s)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    const name =
      collectionSlugs.length === 1
        ? fmt(collectionSlugs[0])
        : `${fmt(collectionSlugs[0])} · +${collectionSlugs.length - 1}`;
    items.push({
      position: position++,
      name,
      item: `${site}/explore${exploreSearchParamsToString(p)}`,
    });
  }
  if (tag && !collectionSlugs.length) {
    const p = { ...sp };
    p.tag = tag;
    items.push({
      position: position++,
      name: String(tag)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${site}/explore${exploreSearchParamsToString(p)}`,
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

  const site = getSiteUrl();
  const collectionSlugs = normalizeExploreCollectionSlugs(
    resolvedSearchParams?.collection,
  );
  const location = resolvedSearchParams?.location;
  const canonicalParams = new URLSearchParams();
  collectionSlugs.forEach((c) => canonicalParams.append("collection", c));
  if (location) canonicalParams.set("location", location);
  const queryString = canonicalParams.toString();
  const canonicalUrl = `${site}/explore${queryString ? `?${queryString}` : ""}`;

  const ogImage = getDefaultOgImageUrl();

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
          url: ogImage,
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
      images: [ogImage],
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

  const collectionSlugs = normalizeExploreCollectionSlugs(searchParams.collection);
  if (collectionSlugs.length) {
    apiParams.collection =
      collectionSlugs.length === 1 ? collectionSlugs[0] : collectionSlugs;
  }

  // Handle all other search params
  if (searchParams.tag) apiParams.tag = searchParams.tag;
  if (searchParams.keyword) apiParams.keyword = searchParams.keyword;
  if (searchParams.price_min)
    apiParams.price_min = parseInt(searchParams.price_min, 10);
  if (searchParams.price_max)
    apiParams.price_max = parseInt(searchParams.price_max, 10);
  if (searchParams.radius) apiParams.radius = parseInt(searchParams.radius, 10);

  const subsExplore = searchParams.sub;
  if (subsExplore) {
    apiParams.sub = Array.isArray(subsExplore) ? subsExplore : [subsExplore];
  }

  const classTypeExplore = searchParams.class_type;
  if (typeof classTypeExplore === "string" && classTypeExplore.trim()) {
    const v = classTypeExplore.trim().toLowerCase();
    if (v !== "class" && v !== "all") {
      apiParams.class_type = classTypeExplore.trim();
    }
  }

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

  apiParams.page_size = 24;

  const [classesResponse, collectionLists] = await Promise.all([
    searchClasses(apiParams),
    fetchExploreCollectionLists(),
  ]);

  return {
    categories: [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    initialGeoSearchNotice: classesResponse.geo_search_notice || null,
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
  const site = getSiteUrl();
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
        url: `${site}/classes/${classItem.slug}`,
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
            priceCurrency: toSchemaPriceCurrency(
              classItem.currency_code || classItem.currency,
            ),
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
        initialGeoSearchNotice={serverData.initialGeoSearchNotice}
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
