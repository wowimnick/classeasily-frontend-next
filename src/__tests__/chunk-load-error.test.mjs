/**
 * Chunk load error detection and recovery helpers.
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_KEY_PREFIX,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack / webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(
    isChunkLoadError({ name: "ChunkLoadError", message: "timeout" }),
    true
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("tryRecoverFromChunkLoadError reloads once per pathname", () => {
  const storage = new Map();
  const reloadCalls = [];

  globalThis.window = {
    location: { pathname: "/explore", reload: () => reloadCalls.push(1) },
  };
  globalThis.sessionStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
  };

  const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(tryRecoverFromChunkLoadError(err), true);
  assert.equal(reloadCalls.length, 1);
  assert.equal(
    storage.get(`${CHUNK_RELOAD_KEY_PREFIX}/explore`),
    "1"
  );

  assert.equal(tryRecoverFromChunkLoadError(err), false);
  assert.equal(reloadCalls.length, 1);

  delete globalThis.window;
  delete globalThis.sessionStorage;
});
