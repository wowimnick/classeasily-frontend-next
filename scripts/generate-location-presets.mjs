import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FALLBACK_GTA_PRESETS } from "../src/data/locationPresets.fallback.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const outputFile = path.join(
  projectRoot,
  "src",
  "_generated",
  "locationPresets.json",
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

function sanitizePresets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const lat = Number(row.coords?.lat);
      const lng = Number(row.coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const name = String(row.name || "").trim();
      const displayName = String(row.displayName || row.name || "").trim();
      if (!name || !displayName) return null;
      return {
        name,
        displayName,
        description: String(row.description || "").trim() || displayName,
        coords: { lat, lng },
        provinceSlug: String(row.provinceSlug || "ontario").trim(),
        citySlug: String(row.citySlug || name.toLowerCase().replace(/\s+/g, "-")).trim(),
        classCount: Number(row.classCount) || 0,
      };
    })
    .filter(Boolean);
}

async function readExistingPresets() {
  try {
    const raw = await readFile(outputFile, "utf8");
    const parsed = JSON.parse(raw);
    return sanitizePresets(parsed?.presets);
  } catch {
    return [];
  }
}

async function writeOutput(presets, meta = {}) {
  const payload = {
    generatedAt: new Date().toISOString(),
    count: presets.length,
    presets,
    ...meta,
  };
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[location-presets] wrote ${presets.length} preset(s) to ${outputFile}`,
  );
}

async function main() {
  await loadBuildEnv();

  const baseUrl = normalizeBaseUrl(
    process.env.LOCATION_PRESETS_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "",
  );

  if (!baseUrl) {
    console.warn(
      "[location-presets] Missing API base URL. Using fallback presets.",
    );
    await writeOutput(FALLBACK_GTA_PRESETS, {
      source: "fallback",
      reason: "missing_api_base_url",
    });
    return;
  }

  const url = `${baseUrl}/search/location-presets/`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    const data = await response.json();
    const presets = sanitizePresets(data?.presets);

    if (!presets.length) {
      console.warn(
        "[location-presets] API returned no presets. Using fallback presets.",
      );
      await writeOutput(FALLBACK_GTA_PRESETS, {
        source: "fallback",
        reason: "empty_api_response",
        apiBaseUrl: baseUrl,
      });
      return;
    }

    await writeOutput(presets, {
      source: "api",
      apiBaseUrl: baseUrl,
    });
  } catch (error) {
    console.error(
      "[location-presets] Generation failed.",
      error,
    );
    const existing = await readExistingPresets();
    if (existing.length > 0) {
      console.warn(
        `[location-presets] Keeping ${existing.length} existing preset(s) from ${outputFile}`,
      );
      return;
    }
    console.warn("[location-presets] Using fallback presets.");
    await writeOutput(FALLBACK_GTA_PRESETS, {
      source: "fallback",
      reason: "fetch_failed",
      apiBaseUrl: baseUrl,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

main();
