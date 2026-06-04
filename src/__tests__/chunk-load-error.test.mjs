/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
  );
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError detects ChunkLoadError by name", () => {
  const err = new Error("Loading failed");
  err.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError detects dynamic import failures", () => {
  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module")),
    true
  );
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
