/** Session memo for instant explore back-nav / stale UI (last few filter snapshots). */

const PREFIX = "explore_results:";
const INDEX_KEY = "explore_results_index_v1";
const MAX_ENTRIES = 5;

/**
 * @param {string} canonQueryString stripPageKey(searchParams.toString())
 * @param {{ results?: unknown[]; count?: number; next?: string | null }} payload
 */
export function stashExploreSearchResults(canonQueryString, payload) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const key = PREFIX + canonQueryString;
    sessionStorage.setItem(
      key,
      JSON.stringify({
        results: payload.results || [],
        count: typeof payload.count === "number" ? payload.count : 0,
        next: payload.next ?? null,
        t: Date.now(),
      }),
    );

    let prevIdx = [];
    try {
      prevIdx = JSON.parse(sessionStorage.getItem(INDEX_KEY) || "[]");
    } catch {
      prevIdx = [];
    }
    const merged = [key, ...prevIdx.filter((k) => k !== key)].slice(
      0,
      MAX_ENTRIES,
    );
    const dropped = prevIdx.filter((k) => !merged.includes(k));
    dropped.forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.setItem(INDEX_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {string} canonQueryString
 * @returns {{ results: unknown[]; count: number; next: string | null } | null}
 */
export function peekExploreSearchResults(canonQueryString) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + canonQueryString);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.results)) return null;
    return {
      results: parsed.results,
      count:
        typeof parsed.count === "number" ? parsed.count : parsed.results.length,
      next: parsed.next ?? null,
    };
  } catch {
    return null;
  }
}
