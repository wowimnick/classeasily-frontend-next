/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches turbopack chunk failure message", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError matches legacy webpack messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isChunkLoadError follows error.cause chain", () => {
  const cause = new Error("Failed to load chunk /_next/static/chunks/abc.js");
  const wrapper = new Error("Dynamic import failed", { cause });
  assert.equal(isChunkLoadError(wrapper), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
