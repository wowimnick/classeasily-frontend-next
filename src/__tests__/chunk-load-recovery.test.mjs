/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack stale chunk message", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
    ),
    true,
  );
});

test("isChunkLoadError matches classic webpack chunk failures", () => {
  assert.equal(isChunkLoadError("Loading chunk 42 failed."), true);
  assert.equal(isChunkLoadError("ChunkLoadError: something"), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError("Failed to load widget settings."), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(""), false);
});
