// app/explore/page.jsx
import { Suspense } from "react";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import { classService } from "@/services/apiService";
import ExplorePageSkeleton from "./_components/ExplorePageSkeleton";

async function getCachedCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch categories from API");
    }

    const data = await res.json();
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, data: [] };
  }
}

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

  // FIXED: Properly handle category and subcategory from URL
  const category = searchParams.category;
  const subcategory = searchParams.subcategory;

  if (category && category !== "all") {
    apiParams.category_key = category;
    if (subcategory) {
      apiParams.subcategory_key = subcategory;
    }
  }

  // FIXED: Handle all other search params
  if (searchParams.tag) apiParams.tag = searchParams.tag;
  if (searchParams.keyword) apiParams.keyword = searchParams.keyword;
  if (searchParams.price_min)
    apiParams.price_min = parseInt(searchParams.price_min, 10);
  if (searchParams.price_max)
    apiParams.price_max = parseInt(searchParams.price_max, 10);
  if (searchParams.radius) apiParams.radius = parseInt(searchParams.radius, 10);
  if (searchParams.date) apiParams.date = searchParams.date;
  if (searchParams.participants)
    apiParams.participants = parseInt(searchParams.participants, 10);
  if (searchParams.sort_by && searchParams.sort_by !== "relevance") {
    apiParams.sort_by = searchParams.sort_by;
  }

  // Handle time preferences and days (array params)
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

  const [categoriesResponse, classesResponse] = await Promise.all([
    getCachedCategories(),
    classService.searchClasses(apiParams).catch((error) => {
      console.error("[Server] Failed to fetch classes:", error);
      return { results: [], count: 0, next: null };
    }),
  ]);

  console.log(
    "[Server] Classes fetched:",
    classesResponse.results?.length || 0
  );

  return {
    categories: categoriesResponse.success ? categoriesResponse.data : [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    locationName: locationDisplayNameFromUrl || "",
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
