import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123",
      ),
    ),
    true,
  );
});

test("isChunkLoadError matches webpack-style messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("CHUNK_RELOAD_SESSION_KEY is stable", () => {
  assert.equal(CHUNK_RELOAD_SESSION_KEY, "ce-chunk-reload-attempted");
});
