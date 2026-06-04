/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack stale chunk message", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_example from module 964893"
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError matches ChunkLoadError name", () => {
  const error = new Error("Loading chunk 12 failed");
  error.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError matches nested cause", () => {
  const cause = new Error("Failed to load chunk abc.js");
  const error = new Error("Wrapper", { cause });
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
