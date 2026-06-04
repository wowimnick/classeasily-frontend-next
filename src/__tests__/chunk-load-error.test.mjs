import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack stale chunk messages", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(
    isChunkLoadError(new Error("Loading chunk 42 failed. (missing: app.js)")),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "" }), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
