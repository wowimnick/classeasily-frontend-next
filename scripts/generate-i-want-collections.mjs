import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const outputFile = path.join(
  projectRoot,
  "src",
  "_generated",
  "iWantCollections.json",
);

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

function filterCollectionsWithActiveClasses(collections) {
  if (!Array.isArray(collections)) return [];
  return collections.filter((c) => {
    if (!c || c.is_all) return true;
    const raw = c.active_class_count ?? c.class_count;
    if (raw === undefined || raw === null) return true;
    return Number(raw) > 0;
  });
}

function sanitizeCollections(raw) {
  return filterCollectionsWithActiveClasses(raw)
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const slug = String(row.slug || row.key || "").trim();
      const name = String(row.name || slug).trim();
      if (!slug) return null;
      const activeRaw = row.active_class_count ?? row.class_count;
      const active_class_count =
        activeRaw === undefined || activeRaw === null
          ? null
          : Number(activeRaw);
      return {
        id: row.id ?? null,
        name,
        slug,
        icon_name: String(row.icon_name || "").trim(),
        color: String(row.color || "").trim(),
        sort_order:
          row.sort_order === undefined || row.sort_order === null
            ? null
            : Number(row.sort_order),
        active_class_count: Number.isFinite(active_class_count)
          ? active_class_count
          : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
}

async function readExistingCollections() {
  try {
    const raw = await readFile(outputFile, "utf8");
    const parsed = JSON.parse(raw);
    return sanitizeCollections(parsed?.collections);
  } catch {
    return [];
  }
}

async function writeOutput(collections, meta = {}) {
  const payload = {
    generatedAt: new Date().toISOString(),
    count: collections.length,
    collections,
    ...meta,
  };
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[i-want-collections] wrote ${collections.length} collection(s) to ${outputFile}`,
  );
}

async function main() {
  await loadBuildEnv();

  const baseUrl = normalizeBaseUrl(
    process.env.I_WANT_COLLECTIONS_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "",
  );

  if (!baseUrl) {
    console.warn(
      "[i-want-collections] Missing API base URL. Keeping existing file if present.",
    );
    const existing = await readExistingCollections();
    if (existing.length > 0) return;
    await writeOutput([], {
      source: "empty",
      reason: "missing_api_base_url",
    });
    return;
  }

  const url = `${baseUrl}/collections/placement/?placement=i_want`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    const data = await response.json();
    const collections = sanitizeCollections(Array.isArray(data) ? data : data?.results);

    if (!collections.length) {
      console.warn(
        "[i-want-collections] API returned no collections. Keeping existing file if present.",
      );
      const existing = await readExistingCollections();
      if (existing.length > 0) return;
      await writeOutput([], {
        source: "empty",
        reason: "empty_api_response",
        apiBaseUrl: baseUrl,
      });
      return;
    }

    await writeOutput(collections, {
      source: "api",
      apiBaseUrl: baseUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[i-want-collections] Generation failed (${message}).`);
    const existing = await readExistingCollections();
    if (existing.length > 0) {
      console.warn(
        `[i-want-collections] Keeping ${existing.length} existing collection(s) from ${outputFile}`,
      );
      return;
    }
    await writeOutput([], {
      source: "empty",
      reason: "fetch_failed",
      apiBaseUrl: baseUrl,
      error: message,
    });
  }
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[i-want-collections] Unexpected error (${message}).`);
  try {
    const existing = await readExistingCollections();
    if (existing.length > 0) return;
    await writeOutput([], {
      source: "empty",
      reason: "unexpected_error",
      error: message,
    });
  } catch {
    process.exitCode = 0;
  }
});
