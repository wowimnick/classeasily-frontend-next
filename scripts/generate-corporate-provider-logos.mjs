import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const outputFile = path.join(
  projectRoot,
  "src",
  "app",
  "corporate",
  "_generated",
  "providerLogos.json",
);

const fallbackLogos = [
  { name: "Google", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg" },
  { name: "Spotify", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/spotify.svg" },
  { name: "Slack", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/slack.svg" },
  { name: "Shopify", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shopify.svg" },
  { name: "Notion", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/notion.svg" },
  { name: "Airbnb", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/airbnb.svg" },
  { name: "Adobe", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/adobe.svg" },
  { name: "Zoom", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/zoom.svg" },
];

const LOGO_LIMIT = Number.parseInt(process.env.CORPORATE_LOGO_LIMIT || "120", 10);
const PAGE_SIZE = Number.parseInt(process.env.CORPORATE_LOGO_PAGE_SIZE || "50", 10);
const MAX_PAGES = Number.parseInt(process.env.CORPORATE_LOGO_MAX_PAGES || "40", 10);
const DETAIL_CONCURRENCY = Number.parseInt(process.env.CORPORATE_LOGO_DETAIL_CONCURRENCY || "8", 10);
const MAX_DETAIL_CHECKS = Number.parseInt(process.env.CORPORATE_LOGO_MAX_DETAIL_CHECKS || "300", 10);

async function loadEnvFile(filePath) {
  try {
    const text = await readFile(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = line.slice(0, eqIndex).trim();
      const value = line
        .slice(eqIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore missing env files
  }
}

async function loadBuildEnv() {
  await loadEnvFile(path.join(projectRoot, ".env"));
  await loadEnvFile(path.join(projectRoot, ".env.local"));
  const mode = process.env.NODE_ENV || "development";
  await loadEnvFile(path.join(projectRoot, `.env.${mode}`));
  await loadEnvFile(path.join(projectRoot, `.env.${mode}.local`));
}

function normalizeBaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  return rawUrl.replace(/\/+$/, "");
}

function parseListPayload(payload) {
  if (Array.isArray(payload)) {
    return { items: payload, next: null };
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.results)) {
    return { items: payload.results, next: payload.next || null };
  }
  return { items: [], next: null };
}

function toAbsoluteUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!baseUrl) return "";
  try {
    return new URL(value, `${baseUrl}/`).toString();
  } catch {
    return "";
  }
}

function isBusinessListingEligible(business) {
  if (!business || typeof business !== "object") return false;
  if (business.disabled === true || business.isDisabled === true) return false;
  if (business.isActive === false || business.is_active === false) return false;
  if (
    business.verificationStatus != null &&
    business.verificationStatus !== "" &&
    String(business.verificationStatus).toLowerCase() !== "verified"
  ) {
    return false;
  }
  return true;
}

function businessToLogo(business, baseUrl) {
  if (!isBusinessListingEligible(business)) return null;
  const name =
    business.businessName ||
    business.name ||
    business.slug ||
    business.businessId ||
    "Provider";
  const logoCandidate =
    business.business_image_medium_url ||
    business.businessImage ||
    business.logo ||
    business.logo_url ||
    "";
  const logo = toAbsoluteUrl(logoCandidate, baseUrl);
  const reviewCount = Number(
    business.totalReviews ??
      business.total_reviews_count ??
      business.review_count ??
      business.reviewCount ??
      0,
  );
  if (!logo) return null;
  return {
    name: String(name).trim(),
    logo,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    slug: business.slug || null,
  };
}

/**
 * Public business detail exposes `classes` as active marketplace classes only.
 * Businesses with none (or only inactive / removed listings) are omitted from the logo rail.
 */
async function fetchActivePublicClassCount(baseUrl, slug) {
  if (!slug || typeof slug !== "string") return 0;
  try {
    const url = `${baseUrl}/businesses/${encodeURIComponent(slug)}/`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return 0;
    const data = await response.json();
    const classes = data.classes;
    return Array.isArray(classes) ? classes.length : 0;
  } catch {
    return 0;
  }
}

async function filterLogosWithActivePublicClasses(baseUrl, sortedCandidates, limit) {
  const accepted = [];
  let idx = 0;
  let fetchesDone = 0;

  while (
    accepted.length < limit &&
    idx < sortedCandidates.length &&
    fetchesDone < MAX_DETAIL_CHECKS
  ) {
    const batch = [];
    while (
      batch.length < DETAIL_CONCURRENCY &&
      idx < sortedCandidates.length &&
      fetchesDone + batch.length < MAX_DETAIL_CHECKS
    ) {
      const c = sortedCandidates[idx++];
      if (c?.slug) batch.push(c);
    }
    if (!batch.length) break;

    const results = await Promise.all(
      batch.map(async (entry) => {
        const count = await fetchActivePublicClassCount(baseUrl, entry.slug);
        return count >= 1 ? { ...entry, activePublicClassCount: count } : null;
      }),
    );
    fetchesDone += batch.length;

    for (const row of results) {
      if (row && accepted.length < limit) accepted.push(row);
    }
  }

  return dedupeLogos(accepted);
}

function dedupeLogos(logos) {
  const seen = new Set();
  const result = [];
  for (const item of logos) {
    const key = `${item.logo}::${item.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function fetchAllBusinesses(baseUrl) {
  const all = [];
  let page = 1;
  let nextUrl = `${baseUrl}/businesses/?page=1&page_size=${PAGE_SIZE}`;
  while (nextUrl && page <= MAX_PAGES) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Failed businesses fetch (${response.status}) for URL: ${nextUrl}`);
    }
    const payload = await response.json();
    const parsed = parseListPayload(payload);
    all.push(...parsed.items);
    if (!parsed.next) break;
    nextUrl = toAbsoluteUrl(parsed.next, baseUrl);
    page += 1;
  }
  return all;
}

async function writeOutput(logos, meta = {}) {
  const payload = {
    generatedAt: new Date().toISOString(),
    count: logos.length,
    logos,
    ...meta,
  };
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[corporate-logos] wrote ${logos.length} logos to ${outputFile}`);
}

async function main() {
  await loadBuildEnv();

  const baseUrl = normalizeBaseUrl(
    process.env.CORPORATE_LOGO_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "",
  );

  if (!baseUrl) {
    console.warn(
      "[corporate-logos] Missing CORPORATE_LOGO_API_BASE_URL/NEXT_PUBLIC_API_URL. Using fallback logos.",
    );
    await writeOutput(fallbackLogos, {
      source: "fallback",
      reason: "missing_api_base_url",
    });
    return;
  }

  try {
    const businesses = await fetchAllBusinesses(baseUrl);
    const candidates = dedupeLogos(
      businesses
        .map((business) => businessToLogo(business, baseUrl))
        .filter(Boolean)
        .sort((a, b) => b.reviewCount - a.reviewCount),
    );

    const logos = await filterLogosWithActivePublicClasses(baseUrl, candidates, LOGO_LIMIT);

    if (!logos.length) {
      console.warn("[corporate-logos] No logos with active public classes. Using fallback logos.");
      await writeOutput(fallbackLogos, {
        source: "fallback",
        reason: "no_eligible_logos_after_class_filter",
      });
      return;
    }

    await writeOutput(logos, {
      source: "api",
      apiBaseUrl: baseUrl,
      fetchedBusinesses: businesses.length,
      detailConcurrency: DETAIL_CONCURRENCY,
      maxDetailChecks: MAX_DETAIL_CHECKS,
      limit: LOGO_LIMIT,
    });
  } catch (error) {
    console.error("[corporate-logos] Generation failed. Using fallback logos.", error);
    await writeOutput(fallbackLogos, {
      source: "fallback",
      reason: "fetch_failed",
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

main();
