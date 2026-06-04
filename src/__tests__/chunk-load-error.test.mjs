/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  filterChunkLoadSentryEvent,
  getErrorMessage,
  isChunkLoadError,
  isLikelyBotSentryEvent,
  isLikelyBotUserAgent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("isLikelyBotUserAgent detects crawlers", () => {
  assert.equal(
    isLikelyBotUserAgent({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }),
    true,
  );
  assert.equal(
    isLikelyBotUserAgent({
      userAgent:
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 Chrome",
    }),
    false,
  );
});

test("isLikelyBotSentryEvent uses Sentry browser tags", () => {
  assert.equal(
    isLikelyBotSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({ tags: { browser: "Chrome 120" } }),
    false,
  );
});

test("filterChunkLoadSentryEvent drops bot chunk errors", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(filterChunkLoadSentryEvent(event, {}), null);
});

test("getErrorMessage handles strings and Error objects", () => {
  assert.equal(getErrorMessage("oops"), "oops");
  assert.equal(getErrorMessage(new Error("boom")), "boom");
});
