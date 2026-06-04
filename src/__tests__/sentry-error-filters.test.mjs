/**
 * Run: node --test src/__tests__/sentry-error-filters.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isChunkLoadError,
  isLikelyCrawlerEvent,
  shouldDropSentryEvent,
} from "../lib/sentry-error-filters.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js from module 1",
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError({ message: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError("TypeError: x is not a function"), false);
});

test("isLikelyCrawlerEvent detects GoogleOther and user agents", () => {
  assert.equal(
    isLikelyCrawlerEvent({ tags: { "browser.name": "GoogleOther" } }),
    true,
  );
  assert.equal(
    isLikelyCrawlerEvent({
      request: { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } },
    }),
    true,
  );
  assert.equal(
    isLikelyCrawlerEvent({ tags: { "browser.name": "Chrome" } }),
    false,
  );
});

test("shouldDropSentryEvent drops crawler chunk failures only", () => {
  const chunkError = new Error(
    "Failed to load chunk /_next/static/chunks/x.js from module 1",
  );
  const crawlerEvent = {
    tags: { "browser.name": "GoogleOther" },
    exception: { values: [{ value: chunkError.message }] },
  };
  assert.equal(shouldDropSentryEvent(crawlerEvent, { originalException: chunkError }), true);

  const userEvent = {
    tags: { "browser.name": "Chrome" },
    exception: { values: [{ value: chunkError.message }] },
  };
  assert.equal(shouldDropSentryEvent(userEvent, { originalException: chunkError }), false);
});

test("getErrorMessage handles strings and Error objects", () => {
  assert.equal(getErrorMessage("hello"), "hello");
  assert.equal(getErrorMessage(new Error("oops")), "oops");
});
