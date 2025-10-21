// app/explore/actions.js
'use server'

import { searchClasses } from '@/lib/server-data-fetchers';

export async function searchClassesAction(params) {
  'use server';
  
  console.log('[Server Action] Searching classes with params:', params);
  
  try {
    const result = await searchClasses(params);
    
    console.log('[Server Action] Found', result.results?.length || 0, 'classes');
    
    return {
      success: true,
      results: result.results || [],
      count: result.count || 0,
      next: result.next || null,
      previous: result.previous || null,
    };
  } catch (error) {
    console.error('[Server Action] Error searching classes:', error);
    return {
      success: false,
      results: [],
      count: 0,
      next: null,
      previous: null,
      error: error.message,
    };
  }
}