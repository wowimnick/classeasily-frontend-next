/**
 * Fetch all classes for static generation (no filters)
 * Used by generateStaticParams
 */
export async function fetchAllClassesForStaticGeneration(page = 1, pageSize = 50) {
  try {
    const response = await fetch(
      `${BASE_URL}/classes/?page=${page}&page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      results: data?.results || [],
      count: data?.count || 0,
      next: data?.next || null,
      hasMore: !!data?.next,
    };
  } catch (error) {
    console.error('Error fetching classes for static generation:', error);
    return {
      success: false,
      results: [],
      count: 0,
      next: null,
      hasMore: false,
    };
  }
}