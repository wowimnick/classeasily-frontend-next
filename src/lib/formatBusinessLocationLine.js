/**
 * Format a business location for display. Geocoded `address` often already includes
 * city, region, postal code, and country — appending structured fields duplicates text
 * (e.g. "…Toronto, ON … Canada, Toronto, Ontario, M4M").
 */

const CA_PROVINCE_TO_ABBR = {
  alberta: "ab",
  "british columbia": "bc",
  manitoba: "mb",
  "new brunswick": "nb",
  "newfoundland and labrador": "nl",
  "northwest territories": "nt",
  "nova scotia": "ns",
  nunavut: "nu",
  ontario: "on",
  "prince edward island": "pe",
  quebec: "qc",
  saskatchewan: "sk",
  yukon: "yt",
};

function normalizeComparable(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function stateAppearsInAddress(addrLower, state) {
  if (!state) return true;
  const s = state.trim().toLowerCase();
  if (!s) return true;
  /** Avoid false positives (e.g. "on" inside "Toronto"). */
  if (s.length >= 4) {
    if (addrLower.includes(s)) return true;
    const abbr = CA_PROVINCE_TO_ABBR[s];
    if (abbr && new RegExp(`(^|[,\\s])${abbr}([,\\s]|$)`).test(addrLower)) return true;
    return false;
  }
  const abbrFromFullName = CA_PROVINCE_TO_ABBR[s];
  if (abbrFromFullName) {
    const a = abbrFromFullName;
    return (
      new RegExp(`(^|[,\\s])${a}([,\\s]|$)`).test(addrLower) ||
      addrLower.includes(s)
    );
  }
  if (s.length === 2) {
    return new RegExp(`(^|[,\\s])${s}([,\\s]|$)`).test(addrLower);
  }
  return addrLower.includes(s);
}

function zipAppearsInAddress(addrLower, zip) {
  if (!zip) return true;
  const z = String(zip).trim().toLowerCase().replace(/\s+/g, "");
  const a = addrLower.replace(/\s+/g, "");
  if (!z) return true;
  if (a.includes(z)) return true;
  if (z.length >= 3 && a.includes(z.slice(0, 3))) return true;
  return false;
}

/**
 * @param {{ address?: string, unit?: string, city?: string, state?: string, zip_code?: string }} loc
 * @returns {string}
 */
export function formatBusinessLocationLine(loc) {
  const unit = (loc.unit || "").trim();
  const address = (loc.address || "").trim();
  const city = (loc.city || "").trim();
  const state = (loc.state || "").trim();
  const zip = (loc.zip_code || "").trim();

  if (!address) {
    return [unit, city, state, zip].filter(Boolean).join(", ");
  }

  const addrLower = address.toLowerCase();
  const cityMatch = !city || addrLower.includes(city.toLowerCase());
  const stateMatch = stateAppearsInAddress(addrLower, state);
  const zipMatch = zipAppearsInAddress(addrLower, zip);

  if (cityMatch && stateMatch && zipMatch) {
    if (unit && !addrLower.includes(unit.toLowerCase())) {
      return `${unit}, ${address}`;
    }
    return address;
  }

  const tail = [city, state, zip].filter(Boolean).join(", ");
  if (tail) {
    const tailNorm = normalizeComparable(tail);
    const addrNorm = normalizeComparable(address);
    if (tailNorm.length >= 6 && addrNorm.includes(tailNorm)) {
      if (unit && !addrLower.includes(unit.toLowerCase())) return `${unit}, ${address}`;
      return address;
    }
  }

  return [address, unit, tail].filter(Boolean).join(", ");
}

function normalizePart(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function locationIdentityKeyForDedupe(loc) {
  const address = normalizePart(loc.address);
  const unit = normalizePart(loc.unit);
  const city = normalizePart(loc.city);
  const state = normalizePart(loc.state);
  const zip = String(loc.zip_code || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  if (address || unit || city || state || zip) {
    return `f:${address}|${unit}|${city}|${state}|${zip}`;
  }
  const lat = loc.latitude != null ? parseFloat(loc.latitude) : NaN;
  const lng = loc.longitude != null ? parseFloat(loc.longitude) : NaN;
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    const rlat = Math.round(lat * 1e5) / 1e5;
    const rlng = Math.round(lng * 1e5) / 1e5;
    return `ll:${rlat},${rlng}`;
  }
  const compact = normalizeComparable(formatBusinessLocationLine(loc));
  if (compact) return `s:${compact}`;
  return `id:${loc.id != null ? String(loc.id) : String(loc.name || "")}`;
}

/**
 * Drop duplicate venues (e.g. legacy + synced rows) when coordinates match closely.
 * Prefers `is_primary` and stable name order.
 * @param {Array<Record<string, unknown>>} locations
 * @returns {Array<Record<string, unknown>>}
 */
export function dedupeBusinessLocationsForDisplay(locations) {
  if (!locations?.length) return [];

  const sorted = [...locations].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const seen = new Set();
  const out = [];

  for (const loc of sorted) {
    const key = locationIdentityKeyForDedupe(loc);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(loc);
  }

  return out;
}
