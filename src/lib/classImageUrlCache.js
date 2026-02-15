"use client";

/**
 * In-memory cache for class image URLs. TTL 50 minutes so cached URLs stay valid
 * under typical backend credential lifetime; refetch on image load error.
 */
const TTL_MS = 50 * 60 * 1000; // 50 minutes
const cache = new Map(); // imageId -> { url: string, expiresAt: number }

export function getCachedClassImageUrl(imageId) {
  if (imageId == null) return null;
  const entry = cache.get(Number(imageId));
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.url || null;
}

export function setCachedClassImageUrl(imageId, url) {
  if (imageId == null) return;
  cache.set(Number(imageId), { url: url || "", expiresAt: Date.now() + TTL_MS });
}

export function invalidateClassImageUrl(imageId) {
  if (imageId != null) cache.delete(Number(imageId));
}
