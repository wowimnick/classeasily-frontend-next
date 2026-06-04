/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerBrowserTag,
  isCrawlerUserAgent,
  shouldIgnoreSentryChunkEvent,
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
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("isCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36",
    ),
    true,
  );
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("isCrawlerBrowserTag matches Sentry browser tags", () => {
  assert.equal(isCrawlerBrowserTag("GoogleOther"), true);
  assert.equal(isCrawlerBrowserTag("Chrome"), false);
});

test("shouldIgnoreSentryChunkEvent drops crawler chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
  );
  const event = {
    tags: { browser: "GoogleOther" },
    exception: { values: [{ value: error.message }] },
  };
  assert.equal(shouldIgnoreSentryChunkEvent(event, { originalException: error }), true);
});

test("shouldIgnoreSentryChunkEvent keeps real-user chunk failures", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/abc.js");
  const event = {
    tags: { browser: "Chrome" },
    exception: { values: [{ value: error.message }] },
  };
  assert.equal(shouldIgnoreSentryChunkEvent(event, { originalException: error }), false);
});
