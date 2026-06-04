/**
 * Detect Next.js / Turbopack stale-chunk failures after a deployment.
 * These are transient: the HTML references chunks from a prior build.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.reason?.message || String(error);
  const name =
    typeof error === "object" && error !== null ? error.name || error.type : "";

  const haystack = `${name} ${message}`.trim();
  if (!haystack) return false;

  return (
    /Failed to load chunk/i.test(haystack) ||
    /Loading chunk \d+ failed/i.test(haystack) ||
    /ChunkLoadError/i.test(haystack) ||
    /dynamically imported module/i.test(haystack)
  );
}
