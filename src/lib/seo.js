/**
 * Central site URL + SEO helpers (canonical, JSON-LD, OG images).
 * Prefer NEXT_PUBLIC_SITE_URL in env; fall back to production default.
 */
export const DEFAULT_SITE_URL = "https://classeasily.com";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return String(raw).replace(/\/+$/, "");
}

/** Default OG image (self-hosted under /public/og/). */
export function getDefaultOgImageUrl() {
  return `${getSiteUrl()}/og/default-open-graph.png`;
}

/**
 * ISO 4217 for schema.org Offer.priceCurrency.
 * API may return symbols; map common ones to codes.
 */
export function toSchemaPriceCurrency(value) {
  if (value == null || value === "") return "CAD";
  const s = String(value).trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(s)) return s;
  const sym = String(value).trim();
  if (sym === "$" || sym === "USD") return "USD";
  if (sym === "CA$" || sym === "CAD" || sym === "C$") return "CAD";
  if (sym === "£" || sym === "GBP") return "GBP";
  if (sym === "€" || sym === "EUR") return "EUR";
  return "CAD";
}

/** BCP 47 locale for compact money display (CAD → en-CA so $ reads as Canadian). */
export function moneyFormatLocale(iso) {
  if (iso === "CAD") return "en-CA";
  if (iso === "USD") return "en-US";
  if (iso === "GBP") return "en-GB";
  if (iso === "EUR") return "de-DE";
  return undefined;
}

/**
 * Format a money amount for UI (peek bar, etc.) — avoids "CAD125".
 */
export function formatMoneyCompact(amount, currencyCodeOrSymbol) {
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (!Number.isFinite(n)) return { text: "Free", currency: null };
  const iso = toSchemaPriceCurrency(currencyCodeOrSymbol);
  try {
    return {
      text: new Intl.NumberFormat(moneyFormatLocale(iso), {
        style: "currency",
        currency: iso,
        maximumFractionDigits: 0,
      }).format(Math.round(n)),
      currency: iso,
    };
  } catch {
    return { text: `${iso} ${Math.round(n)}`, currency: iso };
  }
}

/**
 * Explore marketplace URLs are retired; keep the export so leftover
 * callers (including deprecated trees) do not break.
 */
export function getExplorePathFromSlug(_slugArray) {
  return "/";
}

/**
 * Next.js `searchParams.collection` may be a string or string[] when the query repeats
 * (`?collection=slug-a&collection=slug-b`).
 */
export function normalizeExploreCollectionSlugs(collection) {
  if (collection == null || collection === "") return [];
  const raw = Array.isArray(collection) ? collection : [collection];
  return raw.map((s) => String(s).trim()).filter(Boolean);
}

/**
 * Serialize search params object to query string (supports array values).
 */
export function exploreSearchParamsToString(params) {
  if (!params || typeof params !== "object") return "";
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null && v !== "") usp.append(key, String(v));
      });
    } else {
      usp.set(key, String(value));
    }
  }
  const q = usp.toString();
  return q ? `?${q}` : "";
}

/**
 * Explore marketplace URLs are retired; keep the export so leftover
 * callers (including deprecated trees) do not break.
 */
export function getExploreAbsoluteUrl(_slugArray, _plainSearchParams) {
  return `${getSiteUrl()}/`;
}

/**
 * Placeholder for future hreflang alternates (single-locale for now).
 * @returns {import('next').Metadata["alternates"] extends { languages?: infer L } ? L : never}
 */
export function getHreflangAlternates(_canonicalPath) {
  return undefined;
}
