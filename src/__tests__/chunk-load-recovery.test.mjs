/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyBotUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError("TypeError: et.some is not a function"), false);
});

test("isLikelyBotUserAgent detects crawlers", () => {
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36",
    ),
    true,
  );
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops GoogleOther chunk failures", () => {
  const event = {
    message:
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    tags: { browser: "GoogleOther" },
  };
  const hint = {
    originalException: new Error(event.message),
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, hint), true);
});

test("shouldDropChunkLoadSentryEvent keeps real-user chunk failures", () => {
  const event = {
    message: "Failed to load chunk /_next/static/chunks/abc.js",
    tags: { browser: "Chrome 120" },
  };
  const hint = {
    originalException: new Error(event.message),
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, hint), false);
});
