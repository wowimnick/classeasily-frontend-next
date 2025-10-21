// app/explore/[...slug]/page.jsx

import { Suspense } from "react";
import {
  searchClasses,
  fetchHomepageCategories,
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
    name: `Classes and Workshops${locationName ? ` in ${locationName}` : ""}`,
    description: `Find local classes and workshops${
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
          name: classItem.business_name || "Classeasily",
        },
        url: `https://www.classeasily.com/classes/${classItem.slug}`,
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

    const categoryKey = searchParams.category || "";
    const tag = searchParams.tag || "";
    const locationParam = searchParams.location;

    const cityText = unslugify(
      city || (identifier && !categoryKey ? identifier : "")
    );
    const provinceText = unslugify(province);
    const locationText = cityText
      ? `${cityText}${provinceText ? `, ${provinceText}` : ""}`
      : locationParam
      ? unslugify(locationParam)
      : "";
    const tagText = unslugify(tag);

    let categoryText = "";
    if (categoryKey) {
      try {
        const categoriesResponse = await fetchHomepageCategories();
        if (categoriesResponse.success) {
          const categoryObj = categoriesResponse.data.find(
            (c) => c.key === categoryKey
          );
          categoryText = categoryObj
            ? categoryObj.name
            : unslugify(categoryKey);
        } else {
          categoryText = unslugify(categoryKey);
        }
      } catch (error) {
        console.warn("Could not fetch category name for metadata:", error);
        categoryText = unslugify(categoryKey);
      }
    }

    let title = "Explore Classes Near You | Classeasily";
    let description =
      "Find and book amazing local classes and workshops. Start learning something new today!";

    if (tagText && locationText) {
      title = `${tagText} Classes in ${locationText} | Classeasily`;
      description = `Discover the best ${tagText.toLowerCase()} classes and workshops in ${locationText}. Book your spot on Classeasily.`;
    } else if (categoryText && locationText) {
      title = `${categoryText} Classes in ${locationText} | Classeasily`;
      description = `Find and book the best ${categoryText.toLowerCase()} classes and workshops in ${locationText}.`;
    } else if (locationText) {
      title = `Classes and Workshops in ${locationText} | Classeasily`;
      description = `Explore a wide variety of classes in ${locationText}. From art to cooking, find your next learning adventure.`;
    } else if (categoryText) {
      title = `Explore ${categoryText} Classes | Classeasily`;
      description = `Find and book the best ${categoryText.toLowerCase()} classes and workshops in your area.`;
    }

    const url = `/explore/${slug.join("/")}`;
    const plainSearchParams = {};
    for (const [key, value] of Object.entries(searchParams)) {
      plainSearchParams[key] = value;
    }
    const queryString = new URLSearchParams(plainSearchParams).toString();

    const fullUrl = `https://www.classeasily.com${url}${
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
      title: "Explore Classes Near You | Classeasily",
      description:
        "Find and book amazing local classes and workshops. Start learning something new today!",
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

  const category = searchParams.category;
  const subcategory = searchParams.subcategory;

  if (category) {
    apiParams.category_key = category;
    if (subcategory) {
      apiParams.subcategory_key = subcategory;
    }
  }

  if (searchParams.tag) apiParams.tag = searchParams.tag;
  if (searchParams.keyword) apiParams.keyword = searchParams.keyword;
  if (searchParams.price_max)
    apiParams.price_max = parseInt(searchParams.price_max, 10);
  if (searchParams.radius) apiParams.radius = parseInt(searchParams.radius, 10);
  if (searchParams.date) apiParams.date = searchParams.date;
  if (searchParams.participants)
    apiParams.participants = parseInt(searchParams.participants, 10);
  if (searchParams.sort_by && searchParams.sort_by !== "relevance") {
    apiParams.sort_by = searchParams.sort_by;
  }

  // Use the new searchClasses function with category-aware caching
  const [categoriesResponse, classesResponse] = await Promise.all([
    fetchHomepageCategories(),
    searchClasses(apiParams),
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
    categories: categoriesResponse.success ? categoriesResponse.data : [],
    initialClasses: classesResponse.results || [],
    totalCount: classesResponse.count || 0,
    nextPageUrl: classesResponse.next || null,
    locationName,
    routeParams: {
      province,
      city,
      identifier,
    },
  };
}

export default async function ExplorePage({ params, searchParams }) {
  const serverData = await fetchServerData({ params, searchParams });
  const structuredData = generateStructuredData(
    serverData.routeParams,
    serverData.initialClasses,
    serverData.locationName
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense
        fallback={<GlobalLoaderWithInlineStyles text="Loading classes..." />}
      >
        <ExploreClient
          initialCategories={serverData.categories}
          initialClasses={serverData.initialClasses}
          initialTotalCount={serverData.totalCount}
          initialNextPageUrl={serverData.nextPageUrl}
          routeParams={serverData.routeParams}
        />
      </Suspense>
    </>
  );
}
