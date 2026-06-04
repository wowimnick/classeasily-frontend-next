/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyCrawlerClient,
  sentryBeforeSendChunkFilter,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyCrawlerClient detects Google crawlers", () => {
  assert.equal(
    isLikelyCrawlerClient(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawlerClient(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("sentryBeforeSendChunkFilter drops GoogleOther chunk errors", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  const filtered = sentryBeforeSendChunkFilter(
    { tags: { browser: "GoogleOther" } },
    { originalException: error },
  );
  assert.equal(filtered, null);
});
