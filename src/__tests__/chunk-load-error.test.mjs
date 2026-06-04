/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyBotUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyBotUserAgent detects crawlers", () => {
  assert.equal(isLikelyBotUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
  assert.equal(isLikelyBotUserAgent("Mozilla/5.0 Chrome/120.0.0.0"), false);
});

test("shouldDropChunkLoadSentryEvent filters chunk failures", () => {
  const err = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  assert.equal(shouldDropChunkLoadSentryEvent({}, { originalException: err }), true);
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: "Failed to load chunk abc" }] } },
      {},
    ),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: "TypeError: x is not a function" }] } },
      {},
    ),
    false,
  );
});
