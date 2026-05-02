import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Shared cache tags for homepage-content so all callers hit the same Data Cache entry
const HOMEPAGE_CONTENT_TAGS = ["homepage-content", "collections"];

// ==================== CACHE TAG GENERATORS ====================

/**
 * Generate cache tags for class searches
 * This allows granular revalidation based on what changed
 */
function generateSearchCacheTags(params) {
  const tags = ["classes-search"];

  if (params.collection) {
    tags.push(`collection-${params.collection}`);
  }

  // Add location-based tags if coordinates provided
  if (params.lat && params.lng) {
    // Round to 1 decimal to group nearby searches
    const latRounded = Math.round(params.lat * 10) / 10;
    const lngRounded = Math.round(params.lng * 10) / 10;
    tags.push(`location-${latRounded}-${lngRounded}`);
  }

  // Add tag-based searches
  if (params.tag) {
    tags.push(`tag-${params.tag}`);
  }

  return tags;
}

// ==================== ENHANCED CLASS SEARCH FUNCTIONS ====================

/**
 * Search classes with category-aware caching
 * Endpoint: /classes/search/
 */
export async function searchClasses(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    // Standardize page_size if not provided
    if (!params.page_size) {
      queryParams.append("page_size", "24");
    }

    // Explicitly log the params coming in for debugging
    console.log(
      "[server-data-fetchers] searchClasses params:",
      JSON.stringify(params),
    );

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value);
      }
    });

    const url = `${BASE_URL}/classes/search/?${queryParams.toString()}`;
    const cacheTags = generateSearchCacheTags(params);

    // No location/keyword/tag/collection and no date/participant filters: cache for instant explore page
    const hasNoGeoOrFilters =
      !params.lat &&
      !params.lng &&
      !params.location_search &&
      !params.keyword &&
      !params.tag &&
      !params.collection;
    const hasNoExtraFilters =
      !params.date &&
      !params.start_date &&
      !params.end_date &&
      !params.participants &&
      (!params.time_preference || (Array.isArray(params.time_preference) && params.time_preference.length === 0)) &&
      (!params.days || (Array.isArray(params.days) && params.days.length === 0));
    const isCategoryOnlyCacheable = hasNoGeoOrFilters && hasNoExtraFilters;

    const cacheStrategy = isCategoryOnlyCacheable ? "force-cache" : "no-store";
    const nextConfig = { tags: cacheTags };

    if (process.env.NODE_ENV === "development") {
      console.log(`[Server] Fetching classes: ${url}`);
      console.log(
        `[Server] Cache Strategy: ${cacheStrategy}, Tags: ${JSON.stringify(cacheTags)}`,
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: cacheStrategy,
      next: nextConfig,
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();

    return {
      success: true,
      results: data?.results || [],
      count: data?.count || 0,
      next: data?.next || null,
      previous: data?.previous || null,
    };
  } catch (error) {
    console.error("Error searching classes:", error);
    return { success: false, results: [], count: 0, next: null };
  }
}

/**
 * Fetch classes by collection (convenience function)
 */
export async function fetchClassesByCollection(collectionSlug, additionalParams = {}) {
  return searchClasses({
    collection: collectionSlug,
    ...additionalParams,
  });
}

/**
 * Single cached fetch for homepage-content (collections mode).
 * Deduplicated per-request via React cache() and by Data Cache so building
 * many pages (Footer on each) doesn't spam the API.
 */
const fetchHomepageContentCached = cache(async () => {
  const response = await fetch(
    `${BASE_URL}/classes/homepage-content/?mode=collections`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "force-cache",
      next: { revalidate: 3600, tags: HOMEPAGE_CONTENT_TAGS },
    },
  );
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
});

/**
 * Fetch Collections
 * Uses the homepage-content endpoint in 'collections' mode to get the list
 */
export async function fetchClassCollections() {
  try {
    const data = await fetchHomepageContentCached();
    return data.collections || [];
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

/**
 * Explore: featured collection chips + "I want…" (show_in_i_want) list for the type drawer.
 * Single cached homepage-content request.
 */
export async function fetchExploreCollectionLists() {
  try {
    const data = await fetchHomepageContentCached();
    return {
      collections: data.collections || [],
      collectionsIWant: data.collections_i_want || [],
    };
  } catch (error) {
    console.error("Error fetching explore collection lists:", error);
    return { collections: [], collectionsIWant: [] };
  }
}

/**
 * Fetch classes by tag
 */
export async function fetchClassesByTag(tag, additionalParams = {}) {
  return searchClasses({
    tag,
    ...additionalParams,
  });
}

// ==================== BLOG FUNCTIONS ====================

/** Deduplicated per-request so multiple pages (blog list, [slug], tag) don't each hit the API. */
const fetchBlogPostsCached = cache(async (pageSize) => {
  const response = await fetch(
    `${BASE_URL}/blog/posts/?page_size=${pageSize}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "force-cache",
      next: { revalidate: 3600, tags: ["blog-posts"] },
    },
  );
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
});

/**
 * Fetch all blog posts for the blog listing page
 * Endpoint: /blog/posts/
 */
export async function fetchBlogPosts(pageSize = 50) {
  try {
    const data = await fetchBlogPostsCached(pageSize);
    const posts = data?.results || [];
    const count = data?.count || 0;

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchBlogPosts ok", { count, returned: posts.length });
    }

    return {
      success: true,
      posts,
      count,
      next: data?.next || null,
    };
  } catch (error) {
    console.error("[blog] fetchBlogPosts error", error?.message || error);
    return {
      success: false,
      posts: [],
      count: 0,
    };
  }
}

/**
 * Fetch a single blog post by slug
 * Endpoint: /blog/posts/{slug}/
 */
export async function fetchBlogPostBySlug(slug) {
  try {
    const response = await fetch(`${BASE_URL}/blog/posts/${slug}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400,
        tags: ["blog-posts", `blog-post-${slug}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Post not found", status: 404 };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchBlogPostBySlug ok", { slug, title: data?.title });
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("[blog] fetchBlogPostBySlug error", { slug, message: error?.message || error });
    return {
      success: false,
      error: error.message || "Failed to fetch blog post",
    };
  }
}

/**
 * Fetch blog categories
 * Endpoint: /blog/categories/
 */
export async function fetchBlogCategories() {
  try {
    const response = await fetch(`${BASE_URL}/blog/categories/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400,
        tags: ["blog-categories"],
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const categories = Array.isArray(data) ? data : [];

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchBlogCategories ok", { count: categories.length });
    }

    return {
      success: true,
      categories,
    };
  } catch (error) {
    console.error("[blog] fetchBlogCategories error", error?.message || error);
    return {
      success: false,
      categories: [],
    };
  }
}

/**
 * Fetch recent blog posts for sidebar
 * Endpoint: /blog/posts/?page_size=4
 */
export async function fetchRecentBlogPosts(limit = 4) {
  try {
    const response = await fetch(`${BASE_URL}/blog/posts/?page_size=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400,
        tags: ["blog-recent"],
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.results || [];

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchRecentBlogPosts ok", { limit, returned: posts.length });
    }

    return {
      success: true,
      posts,
    };
  } catch (error) {
    console.error("[blog] fetchRecentBlogPosts error", error?.message || error);
    return {
      success: false,
      posts: [],
    };
  }
}

/**
 * Fetch blog posts by category
 * Endpoint: /blog/posts/?category={slug}
 */
export async function fetchBlogPostsByCategory(categorySlug, pageSize = 50) {
  try {
    const response = await fetch(
      `${BASE_URL}/blog/posts/?category=${categorySlug}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache",
        next: {
          revalidate: 86400,
          tags: ["blog-posts", `category-${categorySlug}`],
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, posts: [] };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.results || [];
    const count = data?.count || 0;

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchBlogPostsByCategory ok", { categorySlug, count, returned: posts.length });
    }

    return {
      success: true,
      posts,
      count,
    };
  } catch (error) {
    console.error("[blog] fetchBlogPostsByCategory error", { categorySlug, message: error?.message || error });
    return {
      success: false,
      posts: [],
      count: 0,
    };
  }
}

/**
 * Fetch blog posts by tag (tag slug from URL e.g. "education" -> matches tag "Education")
 * Endpoint: /blog/posts/?tag={tagSlug}
 */
export async function fetchBlogPostsByTag(tagSlug, pageSize = 50) {
  try {
    const response = await fetch(
      `${BASE_URL}/blog/posts/?tag=${encodeURIComponent(tagSlug)}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache",
        next: {
          revalidate: 86400,
          tags: ["blog-posts", `blog-tag-${tagSlug}`],
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, posts: [], count: 0 };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.results || [];
    const count = data?.count || 0;

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[blog] fetchBlogPostsByTag ok", { tagSlug, count, returned: posts.length });
    }

    return {
      success: true,
      posts,
      count,
    };
  } catch (error) {
    console.error("[blog] fetchBlogPostsByTag error", { tagSlug, message: error?.message || error });
    return {
      success: false,
      posts: [],
      count: 0,
    };
  }
}

// ==================== CLASS FUNCTIONS ====================

/**
 * Fetch initial classes for the homepage
 * Endpoint: /classes/
 */
export async function fetchInitialClasses() {
  try {
    const response = await fetch(`${BASE_URL}/classes/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 3600,
        tags: ["classes", "homepage-classes"],
      },
    });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      console.error("Invalid response structure:", data);
      return {
        classes: [],
        nextPageUrl: null,
      };
    }

    return {
      classes: data?.results || [],
      nextPageUrl: data?.next || null,
    };
  } catch (error) {
    console.error("Error fetching initial classes:", error);
    return {
      classes: [],
      nextPageUrl: null,
    };
  }
}

/**
 * Fetch homepage categories (explore page, header, etc.)
 * Endpoint: /categories/
 * Cached indefinitely; revalidate only when categories change (admin triggers revalidateTag("categories")).
 */
export async function fetchHomepageCategories() {
  try {
    const response = await fetch(`${BASE_URL}/categories/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        tags: ["categories"],
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: Array.isArray(data) ? data : data?.data || [],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      data: [],
    };
  }
}

/**
 * Fetch class detail by ID or slug.
 * Cached until invalidated (revalidateTag) when class details or schedules change — no time-based revalidate so pages stay instant.
 */
export async function fetchClassDetail(classIdOrSlug) {
  try {
    const response = await fetch(`${BASE_URL}/classes/${classIdOrSlug}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        tags: ["classes", `class-${classIdOrSlug}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Class not found", status: 404 };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`Error fetching class detail ${classIdOrSlug}:`, error);
    return {
      success: false,
      error: error.message || "Failed to fetch class details",
    };
  }
}

/**
 * Fetch class reviews with caching (for class detail page)
 * Endpoint: /classes/{slug}/reviews/
 */
export async function fetchClassReviews(slug, page = 1, pageSize = 6) {
  if (!slug) return { success: true, data: [] };
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    const response = await fetch(
      `${BASE_URL}/classes/${slug}/reviews/?${params.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "force-cache",
        next: {
          revalidate: 86400,
          tags: ["reviews", `class-${slug}-reviews`, `reviews-page-${page}`],
        },
      },
    );
    if (!response.ok) return { success: true, data: [] };
    const data = await response.json();
    const results = data.results ?? data ?? [];
    return { success: true, data: Array.isArray(results) ? results : [] };
  } catch (error) {
    console.error(`Error fetching class reviews ${slug}:`, error);
    return { success: false, data: [] };
  }
}

// ==================== BUSINESS FUNCTIONS ====================

/**
 * Fetch all public businesses for static generation
 * Endpoint: /businesses/ (PUBLIC_BUSINESSES from apiService)
 */
export async function fetchPublicBusinesses() {
  try {
    const response = await fetch(`${BASE_URL}/businesses/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400, // 2 hours
        tags: ["businesses", "public-businesses"],
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
      results: data?.results || [],
    };
  } catch (error) {
    console.error("Error fetching public businesses:", error);
    return {
      success: false,
      data: null,
      results: [],
    };
  }
}

/**
 * Fetch business detail by slug with caching
 * Endpoint: /businesses/{slug}/ (PUBLIC_BUSINESSES + slug from apiService)
 */
export async function fetchBusinessDetail(slug) {
  try {
    const response = await fetch(`${BASE_URL}/businesses/${slug}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400, // 1 day
        tags: ["businesses", `business-${slug}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Business not found",
          status: 404,
          data: null,
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`Error fetching business detail ${slug}:`, error);
    return {
      success: false,
      error: error.message || "Failed to fetch business details",
      data: null,
    };
  }
}

/**
 * Fetch business reviews with pagination
 * Endpoint: /businesses/{slug}/reviews/ (from fetchBusinessReviews in apiService)
 */
export async function fetchBusinessReviews(slug, page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
      `${BASE_URL}/businesses/${slug}/reviews/?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache",
        next: {
          revalidate: 86400,
          tags: ["reviews", `business-${slug}-reviews`, `reviews-page-${page}`],
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          data: [],
          hasMore: false,
          total: 0,
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data?.results || [],
      hasMore: !!data?.next,
      total: data?.count || 0,
      next: data?.next || null,
    };
  } catch (error) {
    console.error(`Error fetching reviews for ${slug}:`, error);
    return {
      success: false,
      data: [],
      hasMore: false,
      total: 0,
    };
  }
}

// ==================== STRUCTURED DATA GENERATORS ====================

/**
 * Generate structured data for classes
 */
export function generateClassesStructuredData(classes) {
  if (!classes || classes.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: classes.slice(0, 10).map((classItem, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        "@id": `https://classeasily.com/classes/${
          classItem.slug || classItem.classId
        }`,
        name: classItem.title || "Class",
        description: classItem.description || "",
        provider: {
          "@type": "Organization",
          name: classItem.business_name || "Local Business",
        },
        offers: classItem.min_session_price
          ? {
              "@type": "Offer",
              price: classItem.min_session_price,
              priceCurrency: "CAD",
              availability: "https://schema.org/InStock",
            }
          : undefined,
        image:
          classItem.images && classItem.images.length > 0
            ? classItem.images[0].medium_url || classItem.images[0].original_url
            : undefined,
        aggregateRating: classItem.average_rating
          ? {
              "@type": "AggregateRating",
              ratingValue: classItem.average_rating,
              reviewCount: classItem.review_count || 0,
            }
          : undefined,
      },
    })),
  };
}

/**
 * Generate structured data for a single class
 */
export function generateClassStructuredData(classData) {
  if (!classData) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `https://classeasily.com/classes/${
      classData.slug || classData.classId
    }`,
    name: classData.title || "Class",
    description: classData.description || "",
    provider: {
      "@type": "Organization",
      name: classData.business_name || "Local Business",
    },
    offers: classData.min_session_price
      ? {
          "@type": "Offer",
          price: classData.min_session_price,
          priceCurrency: "CAD",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    image:
      classData.images && classData.images.length > 0
        ? classData.images.map((img) => img.medium_url || img.original_url)
        : undefined,
    aggregateRating: classData.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: classData.average_rating,
          reviewCount: classData.review_count || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}

/**
 * Generate structured data for a business
 */
export function generateBusinessStructuredData(businessData) {
  if (!businessData) return null;

  const ratingValue = businessData.average_rating
    ? parseFloat(businessData.average_rating)
    : null;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://classeasily.com/businesses/${businessData.slug}`,
    name: businessData.businessName,
    description: businessData.businessDescription,
    image: businessData.business_image_medium_url,
    url: `https://classeasily.com/businesses/${businessData.slug}`,
    telephone: businessData.studentContactPhone,
    email: businessData.studentContactEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: businessData.businessAddress,
      addressLocality: businessData.businessCity,
      addressRegion: businessData.businessState,
      addressCountry: "CA",
    },
    geo: businessData.classes?.[0]?.coordinates
      ? {
          "@type": "GeoCoordinates",
          latitude: businessData.classes[0].coordinates.split(",")[0],
          longitude: businessData.classes[0].coordinates.split(",")[1],
        }
      : undefined,
    aggregateRating: ratingValue
      ? {
          "@type": "AggregateRating",
          ratingValue: ratingValue,
          reviewCount: businessData.totalReviews || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    openingHoursSpecification:
      businessData.businessHours?.map((hours) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.day,
        opens: hours.isOpen ? hours.open : undefined,
        closes: hours.isOpen ? hours.close : undefined,
      })) || undefined,
  };
}

/**
 * Generate structured data for blog listing page
 */
export function generateBlogStructuredData(posts) {
  if (!posts || posts.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://classeasily.com/blog",
    name: "ClassEasily Blog",
    description: "Inspiration and insights for learners and instructors",
    url: "https://classeasily.com/blog",
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "@id": `https://classeasily.com/blog/${post.slug}`,
      headline: post.title,
      description: post.excerpt,
      image: post.imageUrl,
      datePublished: post.publishedDate,
      author: post.author
        ? {
            "@type": "Person",
            name: post.author.name,
            image: post.author.avatarUrl,
          }
        : undefined,
      publisher: {
        "@type": "Organization",
        name: "ClassEasily",
        logo: {
          "@type": "ImageObject",
          url: "https://classeasily.com/logo.png",
        },
      },
    })),
  };
}

/**
 * Generate structured data for individual blog post
 */
export function generateBlogPostStructuredData(post) {
  if (!post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://classeasily.com/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.imageUrl,
    datePublished: post.publishedDate,
    dateModified: post.updatedDate || post.publishedDate,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
          image: post.author.avatarUrl,
        }
      : {
          "@type": "Organization",
          name: "ClassEasily",
        },
    publisher: {
      "@type": "Organization",
      name: "ClassEasily",
      logo: {
        "@type": "ImageObject",
        url: "https://classeasily.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://classeasily.com/blog/${post.slug}`,
    },
    articleSection: post.category?.name,
    keywords: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags,
    wordCount: post.content ? post.content.split(/\s+/).length : undefined,
    timeRequired: post.readTime ? `PT${post.readTime}M` : undefined,
  };
}

/**
 * Generate breadcrumb structured data for blog post (includes category when present for SEO)
 */
export function generateBlogBreadcrumbStructuredData(post) {
  const base = "https://classeasily.com";
  const items = [
    { position: 1, name: "Home", item: base },
    { position: 2, name: "Blog", item: `${base}/blog` },
  ];
  let pos = 3;
  if (post.category?.slug) {
    items.push({
      position: pos++,
      name: post.category.name || post.category.slug,
      item: `${base}/blog/category/${post.category.slug}`,
    });
  }
  items.push({
    position: pos,
    name: post.title,
    item: `${base}/blog/${post.slug}`,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ position, name, item }) => ({
      "@type": "ListItem",
      position,
      name,
      item,
    })),
  };
}

/**
 * Generate breadcrumb structured data for business page
 */
export function generateBusinessBreadcrumbStructuredData(businessData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://classeasily.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Businesses",
        item: "https://classeasily.com/businesses",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: businessData.businessName,
        item: `https://classeasily.com/businesses/${businessData.slug}`,
      },
    ],
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Preload critical data for the homepage
 */
export async function preloadHomepageData() {
  try {
    // Reuse shared cached fetch (same as Footer/explore) so build doesn't spam the API
    const data = await fetchHomepageContentCached();

    // 2. Extract "Trending"
    const row_collections = [
      {
        title: "Trending",
        subtitle: "Most Popular Experiences",
        slug: "trending",
        classes: data.trending || [],
      },
    ];

    // 3. Extract "Date Night"
    // FIX: The backend returns "date_night" as a root key, not inside the "collections" array.
    const dateNightClasses = data.date_night || [];

    if (dateNightClasses.length > 0) {
      row_collections.push({
        title: "Date Night",
        subtitle: "Perfect experiences for couples",
        slug: "date-night",
        classes: dateNightClasses,
      });
    }

    // 4. Next Week — experiences with at least one schedule next week (prioritized by reviews)
    const nextWeekClasses = data.next_week || [];
    if (nextWeekClasses.length > 0) {
      row_collections.push({
        title: "Happening Next Week",
        subtitle: "Book an experience with availability next week",
        slug: "next-week",
        classes: nextWeekClasses,
        seeAllLink: "/explore",
      });
    }

    // 5. Return row_collections (for the rows) and categories (for the pills)
    return {
      row_collections,
      categories: data.collections || [],
    };
  } catch (error) {
    console.error("Homepage data fetch error:", error);
    return {
      row_collections: [],
      categories: [],
    };
  }
}

/**
 * Fetch business categories for footer
 * Endpoint: /business/all-categories/
 */
export async function fetchBusinessCategories() {
  try {
    const response = await fetch(`${BASE_URL}/business/all-categories/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 86400, // 24 hours
        tags: ["business-categories"],
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching business categories:", error);
    return {
      success: false,
      data: [],
    };
  }
}

/**
 * Revalidate cache tags (Next.js compatible)
 * Updated for Next.js 15+ API changes
 */
export function revalidateTags(tags) {
  if (typeof window === "undefined") {
    try {
      const { revalidateTag } = require("next/cache");

      // FIX: Add 'max' as second argument for each tag
      tags.forEach((tag) => {
        revalidateTag(tag, "max");
        console.log(`✅ Revalidated tag: ${tag}`);
      });

      return { success: true, revalidated: tags };
    } catch (error) {
      console.error("❌ Error revalidating tags:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "Client-side revalidation not supported" };
}
