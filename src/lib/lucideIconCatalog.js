import dynamicIconImports from "lucide-react/dynamicIconImports.mjs";

const LUCIDE_ICON_KEYS = Object.freeze(
  Object.keys(dynamicIconImports).sort((a, b) => a.localeCompare(b)),
);
const LUCIDE_ICON_SET = new Set(LUCIDE_ICON_KEYS);

export const POPULAR_LUCIDE_ICON_KEYS = Object.freeze([
  "box",
  "sparkles",
  "palette",
  "utensils",
  "music",
  "heart",
  "camera",
  "tree-pine",
  "book-open",
  "dumbbell",
  "wine",
  "party-popper",
  "map-pin",
  "ticket",
  "cake",
  "flower",
]);

export function getAllLucideIconKeys() {
  return LUCIDE_ICON_KEYS;
}

export function normalizeLucideIconName(raw) {
  const input = String(raw ?? "").trim();
  if (!input) return "";

  const kebab = input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return LUCIDE_ICON_SET.has(kebab) ? kebab : "";
}

export function formatLucideIconLabel(iconKey) {
  return String(iconKey)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getLucideIconImporter(iconKey) {
  return dynamicIconImports[iconKey] || null;
}

export function searchLucideIcons(query, limit = 80) {
  const normalizedQuery = normalizeLucideIconName(query);
  const searchTerm = String(query ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  if (!searchTerm) {
    return POPULAR_LUCIDE_ICON_KEYS.filter((key) =>
      LUCIDE_ICON_SET.has(key),
    ).slice(0, limit);
  }

  const startsWithMatches = [];
  const containsMatches = [];

  for (const key of LUCIDE_ICON_KEYS) {
    if (key.startsWith(searchTerm)) {
      startsWithMatches.push(key);
      continue;
    }
    if (key.includes(searchTerm)) {
      containsMatches.push(key);
    }
    if (startsWithMatches.length + containsMatches.length >= limit) break;
  }

  if (
    normalizedQuery &&
    !startsWithMatches.includes(normalizedQuery) &&
    !containsMatches.includes(normalizedQuery)
  ) {
    startsWithMatches.unshift(normalizedQuery);
  }

  return [...startsWithMatches, ...containsMatches].slice(0, limit);
}
