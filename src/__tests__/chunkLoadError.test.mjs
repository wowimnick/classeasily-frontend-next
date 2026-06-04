/**
 * Run: node --test src/__tests__/chunkLoadError.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
} from "../lib/chunkLoadError.js";

test("isChunkLoadError matches Turbopack stale chunk message", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_abc from module 964893",
  );
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError matches webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("CHUNK_RELOAD_SESSION_KEY is stable", () => {
  assert.equal(CHUNK_RELOAD_SESSION_KEY, "ce-chunk-reload-attempted");
});
