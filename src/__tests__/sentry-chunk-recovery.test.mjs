/**
 * Run: node --test src/__tests__/sentry-chunk-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadErrorMessage,
  isChunkLoadSentryEvent,
  isKnownCrawlerSentryEvent,
  isKnownCrawlerUserAgent,
  sentryBeforeSend,
} from "../../sentry.chunk-recovery.js";

test("isChunkLoadErrorMessage matches Turbopack and webpack patterns", () => {
  assert.equal(
    isChunkLoadErrorMessage(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadErrorMessage("ChunkLoadError"), true);
  assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
});

test("isKnownCrawlerUserAgent detects GoogleOther / Googlebot", () => {
  assert.equal(isKnownCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isKnownCrawlerUserAgent("GoogleOther"), true);
  assert.equal(
    isKnownCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
    ),
    false,
  );
});

test("sentryBeforeSend drops chunk load events", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/foo.js" }],
    },
  };
  assert.equal(sentryBeforeSend(event, {}), null);
  assert.deepEqual(
    sentryBeforeSend({ exception: { values: [{ value: "Other error" }] } }, {}),
    { exception: { values: [{ value: "Other error" }] } },
  );
});

test("isChunkLoadSentryEvent and crawler helpers", () => {
  assert.equal(
    isChunkLoadSentryEvent(
      { message: "Failed to load chunk abc.js" },
      { originalException: new Error("ignored") },
    ),
    true,
  );
  assert.equal(
    isKnownCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
});
