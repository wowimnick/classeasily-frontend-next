/**
 * Chunk load recovery helpers (deploy stale-cache handling).
 * Run: node --test src/__tests__/chunkLoadRecovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError matches Turbopack / Next.js chunk failure messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("ChunkLoadError: Loading chunk 3 failed")), true);
  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module")),
    true,
  );
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
});

test("CHUNK_RELOAD_SESSION_KEY is a stable string", () => {
  assert.equal(typeof CHUNK_RELOAD_SESSION_KEY, "string");
  assert.ok(CHUNK_RELOAD_SESSION_KEY.length > 0);
});
