import { formatCityForExploreListing } from "@/lib/formatClassLocationForListing";

const CA_PROVINCE_TO_ABBR = {
  alberta: "AB",
  "british columbia": "BC",
  manitoba: "MB",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  "northwest territories": "NT",
  "nova scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince edward island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

function normalizeProvinceAbbr(state) {
  const raw = String(state || "").trim();
  if (!raw) return "";
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  const lower = raw.toLowerCase().replace(/\./g, "");
  return CA_PROVINCE_TO_ABBR[lower] || "";
}

function provinceFromDisplayName(displayName) {
  const raw = String(displayName || "").trim();
  if (!raw) return "";
  const abbrMatch = raw.match(/,\s*([A-Z]{2})\s*(?:,|$)/);
  if (abbrMatch) return abbrMatch[1];
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const abbr = normalizeProvinceAbbr(parts[i]);
    if (abbr) return abbr;
  }
  return "";
}

function resolveCityName({ displayName, city, state, location, searchTerm }) {
  const source = displayName || searchTerm || location;
  if (/^anywhere$/i.test(String(source || "").trim())) {
    return "Anywhere";
  }
  const fromField = String(city || "").trim();
  if (fromField) return fromField;
  const fromAddress = formatCityForExploreListing({
    city: null,
    state,
    location: location || source,
  });
  if (fromAddress) return fromAddress;
  return String(source || "").split(",")[0].trim();
}

/** Municipality only — e.g. "Aurora" (for "Experiences in …" copy). */
export function formatSearchLocationCityName({
  displayName,
  city,
  state,
  location,
  searchTerm,
} = {}) {
  return resolveCityName({ displayName, city, state, location, searchTerm });
}

/** Compact search label — e.g. "Aurora, ON" (matches preset picker style). */
export function formatSearchLocationDisplayLabel({
  displayName,
  city,
  state,
  location,
} = {}) {
  const trimmed = String(displayName || "").trim();
  if (/^anywhere$/i.test(trimmed)) return "Anywhere";

  const cityName = resolveCityName({ displayName, city, state, location });
  if (!cityName) return trimmed;

  const prov =
    normalizeProvinceAbbr(state) || provinceFromDisplayName(displayName);
  if (prov) return `${cityName}, ${prov}`;
  return cityName;
}

/** Normalize persisted / URL location strings that may still be full ALS addresses. */
export function normalizeSearchLocationState({
  displayName,
  searchTerm,
  city,
  state,
} = {}) {
  const label = formatSearchLocationDisplayLabel({
    displayName: displayName || searchTerm,
    city,
    state,
    location: displayName || searchTerm,
  });
  return {
    displayName: label,
    searchTerm: label,
  };
}
