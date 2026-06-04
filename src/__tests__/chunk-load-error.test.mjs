/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldSuppressChunkLoadErrorForSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("shouldSuppressChunkLoadErrorForSentry suppresses chunk failures", () => {
  const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(shouldSuppressChunkLoadErrorForSentry(err), true);
  assert.equal(shouldSuppressChunkLoadErrorForSentry(new Error("other")), false);
});
