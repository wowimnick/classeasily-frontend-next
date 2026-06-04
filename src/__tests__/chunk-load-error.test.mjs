import assert from "node:assert/strict";
import test from "node:test";

import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893";
  assert.equal(isChunkLoadError(message), true);
  assert.equal(isChunkLoadError(new Error(message)), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError("Loading chunk 42 failed."), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError("Network request failed"), false);
  assert.equal(isChunkLoadError(null), false);
});
