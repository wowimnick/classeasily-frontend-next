/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isChunkLoadError,
  isLikelyBot,
  shouldSuppressChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects Next.js turbopack chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 964893",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module")),
    true,
  );
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("getErrorMessage includes Error.cause text", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/a.js");
  error.cause = new Error("404 Not Found");
  assert.match(getErrorMessage(error), /404 Not Found/);
});

test("isLikelyBot detects crawler user agents", () => {
  assert.equal(
    isLikelyBot(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; GoogleOther)",
    ),
    true,
  );
  assert.equal(
    isLikelyBot(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("shouldSuppressChunkLoadSentryEvent drops bot chunk errors", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 964893",
        },
      ],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldSuppressChunkLoadSentryEvent(event), true);
});

test("shouldSuppressChunkLoadSentryEvent keeps real-user chunk errors", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 964893",
        },
      ],
    },
    tags: { browser: "Chrome 120" },
  };
  assert.equal(shouldSuppressChunkLoadSentryEvent(event), false);
});
