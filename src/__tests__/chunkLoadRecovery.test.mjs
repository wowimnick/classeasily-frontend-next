/**
 * Run: node --test src/__tests__/chunkLoadRecovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyBotUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects Turbopack stale chunk messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyBotUserAgent flags crawlers", () => {
  assert.equal(isLikelyBotUserAgent("Mozilla/5.0 GoogleOther"), true);
  assert.equal(isLikelyBotUserAgent("Mozilla/5.0 Chrome/120.0"), false);
});

test("shouldDropChunkLoadSentryEvent drops bot chunk errors", () => {
  const event = {
    contexts: { browser: { name: "GoogleOther" } },
  };
  const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(shouldDropChunkLoadSentryEvent(event, err), true);
});

test("shouldDropChunkLoadSentryEvent keeps non-chunk errors", () => {
  assert.equal(
    shouldDropChunkLoadSentryEvent({}, new Error("TypeError: x is not a function")),
    false,
  );
});
