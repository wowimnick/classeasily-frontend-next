"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Sync a single query param with the URL via router.replace (scroll: false).
 * Preserves other search params. When `enabled` is false, value is always null and setValue is a no-op.
 *
 * @param {string} key - Query param name
 * @param {{ enabled?: boolean }} [options]
 * @returns {[string | null, (next: string | number | null | undefined) => void]}
 */
export function useUrlState(key, options = {}) {
  const { enabled = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(() => {
    if (!enabled) return null;
    const raw = searchParams.get(key);
    if (raw === null || raw === "") return null;
    return raw;
  }, [searchParams, key, enabled]);

  const setValue = useCallback(
    (next) => {
      if (!enabled) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next === null || next === undefined || next === "") {
        params.delete(key);
      } else {
        params.set(key, String(next));
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [enabled, router, pathname, searchParams, key]
  );

  return [value, setValue];
}

/**
 * Batch-update query params in one navigation. Pass null/undefined/"" to remove a key.
 * @returns {(updates: Record<string, string | number | null | undefined>) => void}
 */
export function useReplaceSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") {
          params.delete(k);
        } else {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );
}
