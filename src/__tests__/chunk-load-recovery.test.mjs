/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  filterChunkLoadSentryEvent,
  isChunkLoadError,
  isLikelyBotSentryEvent,
  isLikelyBotUserAgent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
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

test("isLikelyBotUserAgent detects common crawlers", () => {
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("filterChunkLoadSentryEvent drops GoogleOther crawler noise", () => {
  const event = {
    message:
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    tags: { browser: "GoogleOther" },
  };
  assert.equal(filterChunkLoadSentryEvent(event, {}), null);
});

test("isLikelyBotSentryEvent uses browser tag", () => {
  assert.equal(isLikelyBotSentryEvent({ tags: { browser: "GoogleOther" } }), true);
  assert.equal(isLikelyBotSentryEvent({ tags: { browser: "Chrome" } }), false);
});

test("filterChunkLoadSentryEvent keeps unrelated errors", () => {
  const event = { message: "TypeError: Cannot read properties of undefined" };
  assert.equal(filterChunkLoadSentryEvent(event, {}), event);
});
