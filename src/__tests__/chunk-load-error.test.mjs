import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack chunk failure message", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 123",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError matches webpack-style ChunkLoadError", () => {
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isChunkLoadError checks error.cause", () => {
  const error = new Error("Wrapper");
  error.cause = new Error("Failed to load chunk foo.js");
  assert.equal(isChunkLoadError(error), true);
});
