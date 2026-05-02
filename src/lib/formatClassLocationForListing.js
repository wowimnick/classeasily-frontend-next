/**
 * Shorter location line for class list cards (explore, etc.).
 * Instructors store ALS / geocoder output in `location` (street, city, province, postal, country).
 * We **keep street and city** (everything before province), and drop **postal code, province,
 * and country** only — so listings stay readable without "Ontario, Canada, M5V …".
 *
 * @param {{ city?: string | null, state?: string | null, location?: string | null }} p
 * @returns {string}
 */
export function formatClassLocationForListing({ city, state, location }) {
  const raw = (location || "").trim();
  if (raw) {
    const withoutCodes = stripPostalCodes(raw);
    const parts = withoutCodes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const filtered = stripTrailingRegionCountry(parts);
    if (filtered.length > 0) {
      return filtered.join(", ");
    }
  }

  const c = (city || "").trim();
  if (c) return c;
  return (state || "").trim();
}

/** Canadian postal (ANA NAN) and US ZIP */
function stripPostalCodes(s) {
  return String(s)
    .replace(/\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/g, "")
    .replace(/\b\d{5}(-\d{4})?\b/g, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();
}

const COUNTRY_RE =
  /^(canada|united states( of america)?|usa|u\.s\.a\.?|u\.s\.?)$/i;

const CA_PROVINCE_FULL = new Set(
  [
    "alberta",
    "british columbia",
    "manitoba",
    "new brunswick",
    "newfoundland and labrador",
    "northwest territories",
    "nova scotia",
    "nunavut",
    "ontario",
    "prince edward island",
    "quebec",
    "saskatchewan",
    "yukon",
  ].map((x) => x.toLowerCase()),
);

const CA_PROVINCE_ABBR = new Set([
  "ab",
  "bc",
  "mb",
  "nb",
  "nl",
  "nt",
  "ns",
  "nu",
  "on",
  "pe",
  "qc",
  "sk",
  "yt",
]);

/** US state / territory 2-letter codes (common in ALS tails) */
const US_STATE_ABBR = new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
  "dc",
  "as",
  "gu",
  "mp",
  "pr",
  "vi",
  "um",
]);

/**
 * Drop trailing country, then province/state, repeatedly (typical ALS tail).
 * @param {string[]} parts
 * @returns {string[]}
 */
function stripTrailingRegionCountry(parts) {
  const out = [...parts];
  let guard = 0;
  while (out.length > 0 && guard < 20) {
    guard += 1;
    const seg = out[out.length - 1];
    if (!seg?.trim()) {
      out.pop();
      continue;
    }
    if (COUNTRY_RE.test(seg.trim())) {
      out.pop();
      continue;
    }
    if (isProvinceStateSegment(seg)) {
      out.pop();
      continue;
    }
    break;
  }
  return out;
}

function isProvinceStateSegment(seg) {
  const t = seg.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (CA_PROVINCE_FULL.has(lower)) return true;

  const compact = lower.replace(/\./g, "");
  if (compact.length === 2 && /^[a-z]{2}$/.test(compact)) {
    if (CA_PROVINCE_ABBR.has(compact) || US_STATE_ABBR.has(compact)) return true;
  }
  const firstTok = lower.split(/\s+/)[0];
  if (firstTok?.length === 2 && CA_PROVINCE_ABBR.has(firstTok)) return true;

  return false;
}

/** Shortest schedule duration as "1.5 hours" / "45 min" for explore list meta. */
export function formatDurationHoursForListing(minutes) {
  if (minutes == null || minutes === "") return null;
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  const hours = n / 60;
  if (hours < 1) return `${Math.round(n)} min`;
  const rounded = Math.round(hours * 10) / 10;
  const h = rounded % 1 === 0 ? Math.round(rounded) : rounded;
  const unit = h === 1 ? "hour" : "hours";
  return `${h} ${unit}`;
}

/**
 * Explore meta: municipality only (no street). Uses `city` when set; otherwise the last
 * segment of ALS after stripping province/country/postal.
 */
export function formatCityForExploreListing({ city, state, location }) {
  const c = (city || "").trim();
  if (c) return c;
  const raw = (location || "").trim();
  if (!raw) return (state || "").trim();
  const withoutCodes = stripPostalCodes(raw);
  const parts = withoutCodes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filtered = stripTrailingRegionCountry(parts);
  if (filtered.length === 0) return (state || "").trim();
  return filtered[filtered.length - 1];
}
