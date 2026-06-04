/**
 * Run: node --test src/__tests__/chunk-load-errors.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-errors.js";

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
  assert.equal(isChunkLoadError("Loading chunk 12 failed."), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 GoogleOther"), true);
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
    ),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent", () => {
  const chunkErr = new Error("Failed to load chunk /_next/static/chunks/a.js");
  assert.equal(
    shouldDropChunkLoadSentryEvent(chunkErr, { reloadAttempted: false }),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(chunkErr, { reloadAttempted: true }),
    false,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(chunkErr, {
      reloadAttempted: false,
      userAgent: "GoogleOther",
    }),
    true,
  );
});
