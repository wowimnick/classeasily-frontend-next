import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_abc from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("Loading CSS chunk 7 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isChunkLoadError detects dynamic import failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error("Failed to fetch dynamically imported module: https://example.com/chunk.js"),
    ),
    true,
  );
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(new Error("et.some is not a function")), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
});
