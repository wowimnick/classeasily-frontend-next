/**
 * Detect Next.js / Turbopack stale-deployment chunk load failures.
 * These occur when cached HTML references JS chunks from a previous deploy.
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  const candidates = [];
  if (typeof error === "string") {
    candidates.push(error);
  } else {
    if (error.message) candidates.push(error.message);
    if (error.name) candidates.push(error.name);
    if (error.cause) candidates.push(error.cause);
  }

  return candidates.some((value) => {
    const text =
      typeof value === "string"
        ? value
        : value?.message || value?.name || String(value);
    return (
      /Failed to load chunk/i.test(text) ||
      /Loading chunk \d+ failed/i.test(text) ||
      /ChunkLoadError/i.test(text)
    );
  });
}
