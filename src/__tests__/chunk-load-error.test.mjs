/**
 * Chunk load recovery helpers (deploy skew / stale HTML).
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js from module 1"
    ),
    true
  );
  const chunkError = new Error("chunk failed");
  chunkError.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(chunkError), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
});

test("shouldDropChunkLoadSentryEvent filters chunk events", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: error.message }] } },
      { originalException: error }
    ),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: error.message }, {}),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { message: "TypeError: Cannot read properties of undefined" },
      {}
    ),
    false
  );
});
