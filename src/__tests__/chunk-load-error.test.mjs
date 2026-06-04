/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerBrowserTag,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) GoogleOther"), true);
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
    ),
    false,
  );
});

test("isCrawlerBrowserTag uses Sentry browser tag", () => {
  assert.equal(isCrawlerBrowserTag({ tags: { browser: "GoogleOther" } }), true);
  assert.equal(isCrawlerBrowserTag({ tags: { browser: "Chrome" } }), false);
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk errors", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  const event = { tags: { browser: "GoogleOther" } };
  assert.equal(shouldDropChunkLoadSentryEvent(event, { originalException: error }), true);
});
