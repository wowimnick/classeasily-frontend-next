"use client";

import { useState, useEffect, useCallback } from "react";
import { classService } from "@/services/apiService";
import {
  getCachedClassImageUrl,
  setCachedClassImageUrl,
  invalidateClassImageUrl,
} from "@/lib/classImageUrlCache";

/**
 * Resolve class image URL by imageId with in-memory cache (50 min TTL).
 * Call refetch() when the image fails to load (e.g. onError) to invalidate and get a fresh URL.
 */
export function useClassImageUrl(imageId) {
  const [url, setUrl] = useState(() =>
    imageId != null ? getCachedClassImageUrl(imageId) : null,
  );
  const [isLoading, setIsLoading] = useState(
    () => imageId != null && !getCachedClassImageUrl(imageId),
  );
  const [error, setError] = useState(null);

  const fetchUrl = useCallback(async (id) => {
    if (id == null) return;
    const cached = getCachedClassImageUrl(id);
    if (cached) {
      setUrl(cached);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await classService.getClassImageUrls(id);
      const resolvedUrl = data.url ?? data.urls?.[0]?.url ?? "";
      setCachedClassImageUrl(id, resolvedUrl);
      setUrl(resolvedUrl);
    } catch (e) {
      setError(e);
      setUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imageId == null) {
      setUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    fetchUrl(imageId);
  }, [imageId, fetchUrl]);

  const refetch = useCallback(() => {
    if (imageId == null) return;
    invalidateClassImageUrl(imageId);
    fetchUrl(imageId);
  }, [imageId, fetchUrl]);

  return { url: url || null, isLoading, error, refetch };
}
