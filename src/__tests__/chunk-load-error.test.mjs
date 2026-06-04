/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  clearChunkReloadAttempt,
  hasAttemptedChunkReload,
  isChunkLoadError,
  isCrawlerBrowser,
  markChunkReloadAttempted,
  shouldSuppressChunkLoadErrorInSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  const chunkError = new Error("network");
  chunkError.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(chunkError), true);
  assert.equal(isChunkLoadError(new Error("Something else")), false);
});

test("isCrawlerBrowser detects GoogleOther and common bot user agents", () => {
  assert.equal(
    isCrawlerBrowser({
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
      userAgentData: { brands: [{ brand: "GoogleOther" }] },
    }),
    true
  );
  assert.equal(
    isCrawlerBrowser({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
      userAgentData: { brands: [{ brand: "Chromium" }] },
    }),
    false
  );
});

test("shouldSuppressChunkLoadErrorInSentry suppresses crawlers and first reload", () => {
  const chunkErr = new Error("Failed to load chunk /_next/static/chunks/x.js");

  const storage = {
    data: {},
    getItem(key) {
      return this.data[key] ?? null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
  };

  assert.equal(
    shouldSuppressChunkLoadErrorInSentry(chunkErr, {
      navigator: {
        userAgent: "Googlebot",
        userAgentData: { brands: [{ brand: "GoogleOther" }] },
      },
      sessionStorage: storage,
    }),
    true
  );

  assert.equal(
    shouldSuppressChunkLoadErrorInSentry(chunkErr, {
      navigator: { userAgent: "Chrome", userAgentData: { brands: [] } },
      sessionStorage: storage,
    }),
    true
  );

  markChunkReloadAttempted(storage);
  assert.equal(hasAttemptedChunkReload(storage), true);
  assert.equal(
    shouldSuppressChunkLoadErrorInSentry(chunkErr, {
      navigator: { userAgent: "Chrome", userAgentData: { brands: [] } },
      sessionStorage: storage,
    }),
    false
  );

  clearChunkReloadAttempt(storage);
  assert.equal(storage.getItem(CHUNK_RELOAD_SESSION_KEY), null);
});
