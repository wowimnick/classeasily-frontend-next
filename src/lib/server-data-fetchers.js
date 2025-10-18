// lib/server-data-fetchers.js - UPDATED WITH BLOG FUNCTIONS
// Server-only data fetching functions for SSR/SSG
// All functions use Next.js 16 beta compatible caching

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

// ==================== BLOG FUNCTIONS ====================

/**
 * Fetch all blog posts for the blog listing page
 * Endpoint: /blog/posts/
 */
export async function fetchBlogPosts(pageSize = 50) {
  try {
    const response = await fetch(`${BASE_URL}/blog/posts/?page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 3600,
        tags: ['blog-posts']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      posts: data?.results || [],
      count: data?.count || 0,
      next: data?.next || null,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
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
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 3600,
        tags: ['blog-posts', `blog-post-${slug}`]
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Post not found', status: 404 };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(`Error fetching blog post ${slug}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch blog post',
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
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 7200,
        tags: ['blog-categories']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      categories: Array.isArray(data) ? data : [],
    };
  } catch (error) {
    console.error('Error fetching blog categories:', error);
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
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 3600,
        tags: ['blog-recent']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      posts: data?.results || [],
    };
  } catch (error) {
    console.error('Error fetching recent blog posts:', error);
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
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'force-cache',
        next: { 
          revalidate: 3600,
          tags: ['blog-posts', `category-${categorySlug}`]
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, posts: [] };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      posts: data?.results || [],
      count: data?.count || 0,
    };
  } catch (error) {
    console.error(`Error fetching posts for category ${categorySlug}:`, error);
    return {
      success: false,
      posts: [],
      count: 0,
    };
  }
}

/**
 * Generate structured data for blog listing page
 */
export function generateBlogStructuredData(posts) {
  if (!posts || posts.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://www.classeasily.com/blog",
    "name": "ClassEasily Blog",
    "description": "Inspiration and insights for learners and instructors",
    "url": "https://www.classeasily.com/blog",
    "blogPost": posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      "@id": `https://www.classeasily.com/blog/${post.slug}`,
      "headline": post.title,
      "description": post.excerpt,
      "image": post.imageUrl,
      "datePublished": post.publishedDate,
      "author": post.author ? {
        "@type": "Person",
        "name": post.author.name,
        "image": post.author.avatarUrl,
      } : undefined,
      "publisher": {
        "@type": "Organization",
        "name": "ClassEasily",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.classeasily.com/logo.png",
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
    "@id": `https://www.classeasily.com/blog/${post.slug}`,
    "headline": post.title,
    "description": post.excerpt || post.title,
    "image": post.imageUrl,
    "datePublished": post.publishedDate,
    "dateModified": post.updatedDate || post.publishedDate,
    "author": post.author ? {
      "@type": "Person",
      "name": post.author.name,
      "image": post.author.avatarUrl,
    } : {
      "@type": "Organization",
      "name": "ClassEasily",
    },
    "publisher": {
      "@type": "Organization",
      "name": "ClassEasily",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.classeasily.com/logo.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.classeasily.com/blog/${post.slug}`,
    },
    "articleSection": post.category?.name,
    "keywords": Array.isArray(post.tags) ? post.tags.join(", ") : post.tags,
    "wordCount": post.content ? post.content.split(/\s+/).length : undefined,
    "timeRequired": post.readTime ? `PT${post.readTime}M` : undefined,
  };
}

/**
 * Generate breadcrumb structured data for blog post
 */
export function generateBlogBreadcrumbStructuredData(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.classeasily.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.classeasily.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://www.classeasily.com/blog/${post.slug}`
      }
    ]
  };
}

// ==================== EXISTING CLASS FUNCTIONS ====================

/**
 * Fetch initial classes for the homepage
 * Endpoint: /classes/
 */
export async function fetchInitialClasses() {
  try {
    const response = await fetch(`${BASE_URL}/classes/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 3600,
        tags: ['classes']
      }
    });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response structure:', data);
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
    console.error('Error fetching initial classes:', error);
    return {
      classes: [],
      nextPageUrl: null,
    };
  }
}

/**
 * Fetch homepage categories
 * Endpoint: /categories/
 */
export async function fetchHomepageCategories() {
  try {
    const response = await fetch(`${BASE_URL}/categories/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 7200,
        tags: ['categories']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: Array.isArray(data) ? data : (data?.data || []),
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      data: [],
    };
  }
}

/**
 * Fetch featured classes for SEO
 * Endpoint: /classes/?limit=X
 */
export async function fetchFeaturedClasses(limit = 12) {
  try {
    const response = await fetch(`${BASE_URL}/classes/?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 1800,
        tags: ['classes', 'featured']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      classes: data?.results || [],
      total: data?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching featured classes:', error);
    return {
      classes: [],
      total: 0,
    };
  }
}

/**
 * Fetch classes by location for SEO
 * Endpoint: /classes/ with query params
 */
export async function fetchClassesByLocation(lat, lng, radius = 50, limit = 20) {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${BASE_URL}/classes/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 3600,
        tags: ['classes', 'location']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      classes: data?.results || [],
      total: data?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching classes by location:', error);
    return {
      success: false,
      classes: [],
      total: 0,
    };
  }
}

/**
 * Fetch class detail by ID or slug
 * Endpoint: /classes/{classId}/
 */
export async function fetchClassDetail(classIdOrSlug) {
  try {
    const response = await fetch(`${BASE_URL}/classes/${classIdOrSlug}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 1800,
        tags: ['classes', `class-${classIdOrSlug}`]
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Class not found', status: 404 };
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
      error: error.message || 'Failed to fetch class details',
    };
  }
}

/**
 * Generate structured data for classes
 */
export function generateClassesStructuredData(classes) {
  if (!classes || classes.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': classes.slice(0, 10).map((classItem, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Course',
        '@id': `https://www.classeasily.com/classes/${classItem.slug || classItem.classId}`,
        'name': classItem.title || 'Class',
        'description': classItem.description || '',
        'provider': {
          '@type': 'Organization',
          'name': classItem.business_name || 'Local Business',
        },
        'offers': classItem.min_session_price ? {
          '@type': 'Offer',
          'price': classItem.min_session_price,
          'priceCurrency': 'CAD',
          'availability': 'https://schema.org/InStock',
        } : undefined,
        'image': classItem.images && classItem.images.length > 0 
          ? classItem.images[0].medium_url || classItem.images[0].original_url 
          : undefined,
        'aggregateRating': classItem.average_rating ? {
          '@type': 'AggregateRating',
          'ratingValue': classItem.average_rating,
          'reviewCount': classItem.review_count || 0,
        } : undefined,
      },
    })),
  };
}

/**
 * Generate structured data for a single class
 * For individual class detail pages
 */
export function generateClassStructuredData(classData) {
  if (!classData) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `https://www.classeasily.com/classes/${classData.slug || classData.classId}`,
    'name': classData.title || 'Class',
    'description': classData.description || '',
    'provider': {
      '@type': 'Organization',
      'name': classData.business_name || 'Local Business',
    },
    'offers': classData.min_session_price ? {
      '@type': 'Offer',
      'price': classData.min_session_price,
      'priceCurrency': 'CAD',
      'availability': 'https://schema.org/InStock',
    } : undefined,
    'image': classData.images && classData.images.length > 0 
      ? classData.images.map(img => img.medium_url || img.original_url) 
      : undefined,
    'aggregateRating': classData.average_rating ? {
      '@type': 'AggregateRating',
      'ratingValue': classData.average_rating,
      'reviewCount': classData.review_count || 0,
      'bestRating': 5,
      'worstRating': 1,
    } : undefined,
  };
}

/**
 * Fetch business data
 * Endpoint: /businesses/
 */
export async function fetchBusinessData() {
  try {
    const response = await fetch(`${BASE_URL}/businesses/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
      next: { 
        revalidate: 7200,
        tags: ['businesses']
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching business data:', error);
    return null;
  }
}

/**
 * Preload critical data for the homepage
 * This can be called in parallel to speed up data fetching
 */
export async function preloadHomepageData() {
  try {
    const [classesData, categoriesData] = await Promise.allSettled([
      fetchInitialClasses(),
      fetchHomepageCategories(),
    ]);

    return {
      classes: classesData.status === 'fulfilled' 
        ? classesData.value 
        : { classes: [], nextPageUrl: null },
      categories: categoriesData.status === 'fulfilled' 
        ? categoriesData.value 
        : { success: false, data: [] },
    };
  } catch (error) {
    console.error('Error preloading homepage data:', error);
    return {
      classes: { classes: [], nextPageUrl: null },
      categories: { success: false, data: [] },
    };
  }
}

/**
 * Revalidate cache tags (Next.js 16 compatible)
 * Use this for on-demand revalidation
 */
export function revalidateTags(tags) {
  if (typeof window === 'undefined') {
    try {
      const { revalidateTag } = require('next/cache');
      tags.forEach(tag => revalidateTag(tag));
      return { success: true };
    } catch (error) {
      console.error('Error revalidating tags:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Client-side revalidation not supported' };
}