import assert from "node:assert/strict";
import test from "node:test";
import { isChunkLoadError } from "../lib/is-chunk-load-error.js";

test("isChunkLoadError detects Turbopack stale chunk messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
});

test("isChunkLoadError detects webpack ChunkLoadError", () => {
  assert.equal(isChunkLoadError({ message: "Loading chunk 42 failed" }), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "timeout" }), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});
