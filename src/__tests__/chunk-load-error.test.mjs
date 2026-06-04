/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack stale chunk messages", () => {
  const msg =
    "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 123";
  assert.equal(isChunkLoadError(new Error(msg)), true);
  assert.equal(isChunkLoadError(msg), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isCrawlerUserAgent detects Google crawl clients", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
});

test("isCrawlerUserAgent allows normal browsers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});
