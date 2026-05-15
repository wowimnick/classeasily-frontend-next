import { Suspense } from "react";
import { cacheLife } from "next/cache";
import {
  searchClasses,
  fetchExploreCollectionLists,
} from "@/lib/server-data-fetchers";
import ExploreClient from "@/app/explore/_components/ExploreClient";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import {
  exploreSearchParamsToString,
  getDefaultOgImageUrl,
  getExploreAbsoluteUrl,
  getExplorePathFromSlug,
  getSiteUrl,
  normalizeExploreCollectionSlugs,
  toSchemaPriceCurrency,
} from "@/lib/seo";
import { connection } from "next/server";

/** Do not call `connection()` inside `generateMetadata` — it can reject once prerender completes. */

/**
 * Prime a few slug paths for SSG under `cacheComponents` (pairs with `generateMetadata` cache).
 * Other paths still render at request time (`dynamicParams` defaults to true).
 */
export function generateStaticParams() {
  return [
    { slug: ["ontario", "toronto"] },
    { slug: ["british-columbia", "vancouver"] },
    { slug: ["alberta", "calgary"] },
  ];
}

const unslugify = (slug) => {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

function generateStructuredData(routeParams, classes, locationName) {
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

/**
 * Path-based metadata only: under `cacheComponents`, `await searchParams` rejects once
 * prerender completes. Query-driven context stays in JSON-LD + visible page content.
 * `"use cache"` + `cacheLife` keeps `await params` prerender-safe (next-prerender-dynamic-metadata).
 */
export async function generateMetadata({ params }) {
  "use cache";
  cacheLife("homepage");
  try {
    const resolvedParams = await params;
    const { slug = [] } = resolvedParams;
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

    const cityText = unslugify(city || (identifier ? identifier : ""));
    const provinceText = unslugify(province);
    const locationText = cityText
      ? `${cityText}${provinceText ? `, ${provinceText}` : ""}`
      : "";

    let title = "Explore Experiences Near You | ClassEasily";
    let description =
      "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!";

    if (locationText) {
      title = `Experiences and Activities in ${locationText} | ClassEasily`;
      description = `Explore a wide variety of experiences in ${locationText}. From art to cooking, find your next great memory.`;
    }

    const fullUrl = getExploreAbsoluteUrl(slug, {});

    const defaultOgImage = getDefaultOgImageUrl();

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
        siteName: "ClassEasily",
        type: "website",
        locale: "en_US",
        images: [
          {
            url: defaultOgImage,
            width: 1200,
            height: 630,
            alt: "ClassEasily — local classes and experiences",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [defaultOgImage],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
    };
  } catch (error) {
    console.error("Critical error in generateMetadata:", error);
    return {
      title: "Explore Experiences Near You | ClassEasily",
      description:
        "Find and book amazing local experiences and activities. Plan your next date night or outing with friends today!",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
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

  const collectionSlugs = normalizeExploreCollectionSlugs(searchParams.collection);
  if (collectionSlugs.length) {
    apiParams.collection =
      collectionSlugs.length === 1 ? collectionSlugs[0] : collectionSlugs;
  }

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

  // --- DATE RANGE LOGIC ---
  if (searchParams.start_date) apiParams.start_date = searchParams.start_date;
  if (searchParams.end_date) apiParams.end_date = searchParams.end_date;
  if (searchParams.date) apiParams.date = searchParams.date;

  if (searchParams.participants)
    apiParams.participants = parseInt(searchParams.participants, 10);
  if (searchParams.sort_by && searchParams.sort_by !== "relevance") {
    apiParams.sort_by = searchParams.sort_by;
  }

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
    initialGeoSearchNotice: classesResponse.geo_search_notice || null,
    collections: collectionLists.collections || [],
    collectionsIWant: collectionLists.collectionsIWant || [],
    locationName,
    routeParams: {
      province,
      city,
      identifier,
    },
  };
}

function buildExploreBreadcrumbSchema(slug, searchParams, locationName) {
  const site = getSiteUrl();
  const slugArr = Array.isArray(slug) ? slug : [];
  const sp = searchParams && typeof searchParams === "object" ? { ...searchParams } : {};
  const explorePath = getExplorePathFromSlug(slugArr);
  const items = [
    { position: 1, name: "Home", item: `${site}/` },
    { position: 2, name: "Explore", item: `${site}/explore` },
  ];
  let position = 3;
  const [first, second] = slugArr;
  const isCategoryRoute = first === "category";
  let province = null;
  let city = null;
  let identifier = null;
  if (!isCategoryRoute) {
    if (slugArr.length === 1) identifier = first;
    else if (slugArr.length >= 2) {
      province = first;
      city = second;
    }
  }

  const locationDisplay = sp.location || locationName || "";
  const collectionSlugs = normalizeExploreCollectionSlugs(sp.collection);
  const tag = sp.tag;

  const stripGeoFromQuery = (p) => {
    const next = { ...p };
    delete next.location;
    delete next.lat;
    delete next.lng;
    return next;
  };

  if (!isCategoryRoute && province && city) {
    const locLabel = String(
      locationName || `${unslugify(city)}, ${unslugify(province)}`,
    )
      .split(",")[0]
      .trim();
    items.push({
      position: position++,
      name: locLabel,
      item: getExploreAbsoluteUrl([province, city], stripGeoFromQuery(sp)),
    });
  } else if (!isCategoryRoute && identifier && slugArr.length === 1) {
    items.push({
      position: position++,
      name: unslugify(identifier),
      item: getExploreAbsoluteUrl([identifier], stripGeoFromQuery(sp)),
    });
  } else if (locationDisplay) {
    const p = { ...sp };
    p.location = String(locationDisplay);
    items.push({
      position: position++,
      name: String(locationDisplay).split(",")[0].trim(),
      item: `${site}${explorePath}${exploreSearchParamsToString(p)}`,
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
      item: `${site}${explorePath}${exploreSearchParamsToString(p)}`,
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
      item: `${site}${explorePath}${exploreSearchParamsToString(p)}`,
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
  await connection();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const serverData = await fetchServerData({
    params: resolvedParams,
    searchParams: resolvedSearchParams,
  });
  const structuredData = generateStructuredData(
    serverData.routeParams,
    serverData.initialClasses,
    serverData.locationName,
  );
  const breadcrumbSchema = buildExploreBreadcrumbSchema(
    resolvedParams.slug || [],
    resolvedSearchParams,
    serverData.locationName,
  );

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
          initialCollectionsIWant={serverData.collectionsIWant}
          initialGeoSearchNotice={serverData.initialGeoSearchNotice}
          routeParams={serverData.routeParams}
        />
      </Suspense>
    </>
  );
}
