/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  isLikelyBotBrowser,
  shouldSuppressChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(
    isChunkLoadError(new Error("Loading chunk 42 failed. (error: https://example.com/chunk.js)")),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "timeout" }), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isLikelyBotBrowser flags crawler tags", () => {
  assert.equal(isLikelyBotBrowser("GoogleOther"), true);
  assert.equal(isLikelyBotBrowser("Chrome"), false);
});

test("shouldSuppressChunkLoadError drops bot chunk failures", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
  const event = { tags: { browser: "GoogleOther" } };
  assert.equal(shouldSuppressChunkLoadError(event, error), true);
});
