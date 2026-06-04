import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
});

test("isChunkLoadError detects webpack-style chunk messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
});

test("isChunkLoadError detects ChunkLoadError by name", () => {
  const err = new Error("network");
  err.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
