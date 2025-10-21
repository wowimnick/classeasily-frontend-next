// app/businesses/actions.js
'use server'

import { fetchBusinessReviews } from '@/lib/server-data-fetchers';

/**
 * Server action to fetch business reviews with caching
 * This allows client components to fetch cached data without direct API calls
 */
export async function fetchReviewsAction(slug, page = 1, pageSize = 10) {
  'use server';
  
  console.log(`[Server Action] Fetching reviews for ${slug}, page ${page}`);
  
  try {
    const result = await fetchBusinessReviews(slug, page, pageSize);
    
    console.log(`[Server Action] Found ${result.data?.length || 0} reviews`);
    
    return {
      success: result.success,
      data: result.data || [],
      hasMore: result.hasMore || false,
      total: result.total || 0,
      next: result.next || null,
    };
  } catch (error) {
    console.error(`[Server Action] Error fetching reviews:`, error);
    return {
      success: false,
      data: [],
      hasMore: false,
      total: 0,
      next: null,
      error: error.message,
    };
  }
}