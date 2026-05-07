/** In-memory cache: same review text often appears only once, saves duplicate API calls when reopening modal. */
const translationCache = new Map();

export async function fetchReviewTranslation(text) {
  const key = text;
  if (translationCache.has(key)) {
    return translationCache.get(key);
  }
  const promise = (async () => {
    try {
      const res = await fetch("/api/reviews/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      return data && typeof data === "object" ? data : { translated: false };
    } catch {
      return { translated: false, reason: "network" };
    }
  })();
  translationCache.set(key, promise);
  return promise;
}
