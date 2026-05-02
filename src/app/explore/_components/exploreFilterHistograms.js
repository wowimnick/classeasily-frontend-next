/**
 * Build normalized histogram heights (0–1) for filter slider backdrops.
 * Uses the current explore result set (best-effort, not a global population model).
 */

export const PRICE_HISTOGRAM_BUCKETS = 36;
export const DISTANCE_HISTOGRAM_BUCKETS = 36;

export function effectiveListingPrice(classItem) {
  const s = Number(classItem?.min_session_price);
  const c = Number(classItem?.min_course_price);
  const hasS = Number.isFinite(s) && s >= 0;
  const hasC = Number.isFinite(c) && c >= 0;
  if (hasS && hasC) return Math.min(s, c);
  if (hasS) return s;
  if (hasC) return c;
  return null;
}

export function buildNormalizedHistogram(values, min, max, bucketCount) {
  const bins = new Array(bucketCount).fill(0);
  for (const v of values) {
    if (v == null || !Number.isFinite(v)) continue;
    const clamped = Math.min(Math.max(v, min), max);
    const t = max > min ? (clamped - min) / (max - min) : 0;
    const idx = Math.min(bucketCount - 1, Math.floor(t * bucketCount));
    bins[idx] += 1;
  }
  const peak = Math.max(1, ...bins);
  return bins.map((n) => n / peak);
}

export function priceDistributionFromClasses(classes, maxPrice = 500) {
  const values = (classes || [])
    .map(effectiveListingPrice)
    .filter((v) => v != null && Number.isFinite(v));
  if (values.length === 0) {
    return new Array(PRICE_HISTOGRAM_BUCKETS).fill(0.12);
  }
  return buildNormalizedHistogram(values, 0, maxPrice, PRICE_HISTOGRAM_BUCKETS);
}

export function distanceDistributionFromClasses(classes, maxKm = 80) {
  const values = (classes || [])
    .map((c) => c?.distance)
    .filter((d) => d != null && Number.isFinite(d) && d >= 0);
  if (values.length === 0) {
    return new Array(DISTANCE_HISTOGRAM_BUCKETS).fill(0.12);
  }
  return buildNormalizedHistogram(values, 0, maxKm, DISTANCE_HISTOGRAM_BUCKETS);
}
