/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  attemptChunkLoadRecovery,
  isChunkLoadError,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack deployment-skew message", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_abc from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError matches webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("attemptChunkLoadRecovery reloads only once per session", () => {
  const storage = new Map();
  const mockStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  let reloadCount = 0;
  globalThis.window = {
    location: { reload: () => reloadCount++ },
  };

  assert.equal(
    attemptChunkLoadRecovery({ storage: mockStorage }),
    true,
  );
  assert.equal(reloadCount, 1);
  assert.ok(storage.has(CHUNK_RELOAD_SESSION_KEY));

  assert.equal(
    attemptChunkLoadRecovery({ storage: mockStorage }),
    false,
  );
  assert.equal(reloadCount, 1);

  delete globalThis.window;
});
