/** Persisted "continue searching" snapshot — shown on homepage return, expires after 1 hour. */
export const CONTINUE_SEARCH_STORAGE_KEY = "classeasily_continue_search";
export const CONTINUE_SEARCH_TTL_MS = 60 * 60 * 1000;

export function readContinueSearchSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTINUE_SEARCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt >= CONTINUE_SEARCH_TTL_MS) {
      localStorage.removeItem(CONTINUE_SEARCH_STORAGE_KEY);
      return null;
    }
    const loc = parsed?.selectedLocation;
    const hasCity =
      (typeof parsed?.searchTerm === "string" && parsed.searchTerm.trim()) ||
      (loc && typeof loc.displayName === "string" && loc.displayName.trim());
    if (!hasCity) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeContinueSearchSnapshot(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CONTINUE_SEARCH_STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: Date.now() }),
    );
  } catch {
    // optional persistence
  }
}

export function clearContinueSearchSnapshot() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONTINUE_SEARCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
