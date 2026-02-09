import { Suspense } from "react";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import {
  searchClasses,
  fetchHomepageCategories,
  fetchClassCollections,
} from "@/lib/server-data-fetchers";
import ExplorePageSkeleton from "./_components/ExplorePageSkeleton";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category;
  const location = resolvedSearchParams?.location;
  
  let title = "Explore Experiences Near You | Classeasily";
  let description =
    "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!";

  if (category && category !== "all" && location) {
    title = `Explore ${category.charAt(0).toUpperCase() + category.slice(1)} Experiences in ${location} | Classeasily`;
    description = `Discover the best ${category.toLowerCase()} experiences and activities in ${location}. Book your spot today!`;
  } else if (location) {
    title = `Experiences and Activities in ${location} | Classeasily`;
    description = `Explore a wide variety of experiences in ${location}. From art to cooking, find your next great memory.`;
  } else if (category && category !== "all") {
    title = `Explore ${category.charAt(0).toUpperCase() + category.slice(1)} Experiences | Classeasily`;
    description = `Find and book the best ${category.toLowerCase()} experiences and activities in your area.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: "https://classeasily.com/explore",
    },
    openGraph: {
      title,
      description,
      url: "https://classeasily.com/explore",
      type: "website",
      siteName: "Classeasily",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  // Handle category and subcategory from URL
  const category = searchParams.category;
  const subcategory = searchParams.subcategory;
  const collection = searchParams.collection;

  if (collection) {
    apiParams.collection = collection;
  } else if (category && category !== "all") {
    apiParams.category_key = category;
    if (subcategory) {
      apiParams.subcategory_key = subcategory;
    }
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

  const [categoriesResponse, classesResponse, collectionsList] =
    await Promise.all([
      fetchHomepageCategories(),
      searchClasses(apiParams),
      fetchClassCollections(),
    ]);

  return {
    categories: categoriesResponse.success ? categoriesResponse.data : [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    locationName: locationDisplayNameFromUrl || "",
    collections: collectionsList || [],
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
          name: classItem.business_name || "Classeasily Host",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ExploreClient
        initialCategories={serverData.categories}
        initialClasses={serverData.initialClasses}
        initialTotalCount={serverData.totalCount}
        initialNextPageUrl={serverData.nextPageUrl}
        initialCollections={serverData.collections}
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
