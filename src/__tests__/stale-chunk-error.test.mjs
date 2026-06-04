/**
 * Run: node --test src/__tests__/stale-chunk-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isStaleChunkLoadError } from "../lib/stale-chunk-error.js";

test("isStaleChunkLoadError matches Turbopack / Next chunk failures", () => {
  assert.equal(
    isStaleChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(
    isStaleChunkLoadError(new Error("Loading chunk 42 failed.")),
    true,
  );
  assert.equal(isStaleChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isStaleChunkLoadError ignores unrelated errors", () => {
  assert.equal(isStaleChunkLoadError(new Error("Network Error")), false);
  assert.equal(isStaleChunkLoadError(null), false);
  assert.equal(isStaleChunkLoadError(undefined), false);
});
