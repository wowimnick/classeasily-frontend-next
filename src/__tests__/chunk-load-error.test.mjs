import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack stale chunk messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
});

test("isChunkLoadError matches webpack-style chunk messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isChunkLoadError({ message: "ChunkLoadError: something" }), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("CHUNK_RELOAD_SESSION_KEY is stable", () => {
  assert.equal(CHUNK_RELOAD_SESSION_KEY, "ce-chunk-reload-attempted");
});
