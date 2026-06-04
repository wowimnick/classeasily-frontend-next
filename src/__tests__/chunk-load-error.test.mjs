import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failure message", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 123",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
