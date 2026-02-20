import { Suspense } from "react";
import {
  searchClasses,
  fetchClassCollections,
} from "@/lib/server-data-fetchers";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";

const unslugify = (slug) => {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

function generateStructuredData(routeParams, classes, locationName) {
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

export async function generateMetadata({ params, searchParams }) {
  try {
    const { slug = [] } = params;
    const [first, second] = slug;

    let province = null;
    let city = null;
    let identifier = null;

    const isCategoryRoute = first === "category";

    if (!isCategoryRoute) {
      if (slug.length === 1) {
        identifier = first;
      } else if (slug.length >= 2) {
        province = first;
        city = second;
      }
    }

    const collectionSlug = searchParams.collection || "";
    const tag = searchParams.tag || "";
    const locationParam = searchParams.location;

    const cityText = unslugify(
      city || (identifier && !collectionSlug ? identifier : ""),
    );
    const provinceText = unslugify(province);
    const locationText = cityText
      ? `${cityText}${provinceText ? `, ${provinceText}` : ""}`
      : locationParam
        ? unslugify(locationParam)
        : "";
    const tagText = unslugify(tag);
    const collectionText = unslugify(collectionSlug);

    let title = "Explore Experiences Near You | Classeasily";
    let description =
      "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!";

    if (tagText && locationText) {
      title = `${tagText} Experiences in ${locationText} | Classeasily`;
      description = `Discover the best ${tagText.toLowerCase()} experiences and activities in ${locationText}. Book your spot on Classeasily.`;
    } else if (collectionText && locationText) {
      title = `${collectionText} Experiences in ${locationText} | Classeasily`;
      description = `Find and book the best ${collectionText.toLowerCase()} experiences and activities in ${locationText}.`;
    } else if (locationText) {
      title = `Experiences and Activities in ${locationText} | Classeasily`;
      description = `Explore a wide variety of experiences in ${locationText}. From art to cooking, find your next great memory.`;
    } else if (collectionText) {
      title = `Explore ${collectionText} Experiences | Classeasily`;
      description = `Find and book the best ${collectionText.toLowerCase()} experiences and activities in your area.`;
    }

    const url = `/explore/${slug.join("/")}`;
    const plainSearchParams = {};
    for (const [key, value] of Object.entries(searchParams)) {
      plainSearchParams[key] = value;
    }
    const queryString = new URLSearchParams(plainSearchParams).toString();

    const fullUrl = `https://classeasily.com${url}${
      queryString ? `?${queryString}` : ""
    }`;

    return {
      title,
      description,
      alternates: {
        canonical: fullUrl,
      },
      openGraph: {
        title,
        description,
        url: fullUrl,
        type: "website",
      },
    };
  } catch (error) {
    console.error("Critical error in generateMetadata:", error);
    return {
      title: "Explore Experiences Near You | Classeasily",
      description:
        "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!",
    };
  }
}

async function fetchServerData({ params, searchParams }) {
  const { slug = [] } = params;
  const [first, second] = slug;

  let province = null;
  let city = null;
  let identifier = null;

  if (first !== "category") {
    if (slug.length === 1) {
      identifier = first;
    } else if (slug.length >= 2) {
      province = first;
      city = second;
    }
  }

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
  } else if (province && city) {
    apiParams.location_search = `${unslugify(city)}, ${unslugify(province)}`;
  } else if (city) {
    apiParams.location_search = unslugify(city);
  } else if (province) {
    apiParams.location_search = unslugify(province);
  } else if (identifier && first !== "category") {
    apiParams.location_search = unslugify(identifier);
  }

  const collection = searchParams.collection;
  if (collection) {
    apiParams.collection = collection;
  }

  if (searchParams.tag) apiParams.tag = searchParams.tag;
  if (searchParams.keyword) apiParams.keyword = searchParams.keyword;
  if (searchParams.price_max)
    apiParams.price_max = parseInt(searchParams.price_max, 10);
  if (searchParams.radius) apiParams.radius = parseInt(searchParams.radius, 10);

  // --- DATE RANGE LOGIC ---
  if (searchParams.start_date) apiParams.start_date = searchParams.start_date;
  if (searchParams.end_date) apiParams.end_date = searchParams.end_date;
  if (searchParams.date) apiParams.date = searchParams.date;

  if (searchParams.participants)
    apiParams.participants = parseInt(searchParams.participants, 10);
  if (searchParams.sort_by && searchParams.sort_by !== "relevance") {
    apiParams.sort_by = searchParams.sort_by;
  }

  apiParams.page_size = 24;

  const [classesResponse, collectionsList] = await Promise.all([
    searchClasses(apiParams),
    fetchClassCollections(),
  ]);

  let locationName = "";
  if (locationDisplayNameFromUrl) {
    locationName = locationDisplayNameFromUrl;
  } else if (city && province) {
    locationName = `${unslugify(city)}, ${unslugify(province)}`;
  } else if (city) {
    locationName = unslugify(city);
  }

  return {
    categories: [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    collections: collectionsList || [],
    locationName,
    routeParams: {
      province,
      city,
      identifier,
    },
  };
}

function buildExploreBreadcrumbSchema(searchParams, locationName) {
  const base = "https://classeasily.com";
  const items = [
    { position: 1, name: "Home", item: `${base}/` },
    { position: 2, name: "Explore", item: `${base}/explore` },
  ];
  let position = 3;
  const location = searchParams?.location || locationName;
  const collection = searchParams?.collection;
  const tag = searchParams?.tag;
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (location) {
    items.push({
      position: position++,
      name: typeof location === "string" ? location.split(",")[0].trim() : location,
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

export default async function ExplorePage({ params, searchParams }) {
  const resolvedSearchParams = typeof searchParams?.then === "function" ? await searchParams : searchParams;
  const serverData = await fetchServerData({ params, searchParams: resolvedSearchParams });
  const structuredData = generateStructuredData(
    serverData.routeParams,
    serverData.initialClasses,
    serverData.locationName,
  );
  const breadcrumbSchema = buildExploreBreadcrumbSchema(resolvedSearchParams, serverData.locationName);

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
      <Suspense
        fallback={
          <GlobalLoaderWithInlineStyles text="Loading experiences..." />
        }
      >
        <ExploreClient
          initialCategories={serverData.categories}
          initialClasses={serverData.initialClasses}
          initialTotalCount={serverData.totalCount}
          initialNextPageUrl={serverData.nextPageUrl}
          initialCollections={serverData.collections}
          routeParams={serverData.routeParams}
        />
      </Suspense>
    </>
  );
}
