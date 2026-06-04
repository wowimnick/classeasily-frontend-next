/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_LOAD_ERROR_RE,
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack stale chunk messages", () => {
  assert.ok(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
      )
    )
  );
  assert.ok(isChunkLoadError(new Error("Loading chunk 42 failed")));
  assert.ok(isChunkLoadError({ message: "ChunkLoadError" }));
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Failed to load tickets.")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("CHUNK_LOAD_ERROR_RE is exported for Sentry filtering", () => {
  assert.match(
    "Failed to load chunk /_next/static/chunks/foo.js",
    CHUNK_LOAD_ERROR_RE
  );
});
