import { Suspense } from "react";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import {
  searchClasses,
  fetchHomepageCategories,
  fetchClassCollections,
} from "@/lib/server-data-fetchers";
import ExplorePageSkeleton from "./_components/ExplorePageSkeleton";

export async function generateMetadata() {
  return {
    title: "Explore Classes Near You | Classeasily",
    description:
      "Find and book amazing local classes and workshops. Start learning something new today!",
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

  console.log("[Server] Fetching classes with params:", apiParams);

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

async function ExplorePageContent({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const serverData = await fetchServerData(resolvedSearchParams);

  return (
    <ExploreClient
      initialCategories={serverData.categories}
      initialClasses={serverData.initialClasses}
      initialTotalCount={serverData.totalCount}
      initialNextPageUrl={serverData.nextPageUrl}
      initialCollections={serverData.collections}
      routeParams={serverData.routeParams}
    />
  );
}

export default async function ExploreRootPage(props) {
  return (
    <Suspense fallback={<ExplorePageSkeleton />}>
      <ExplorePageContent searchParams={props.searchParams} />
    </Suspense>
  );
}
