import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_STORAGE_KEY,
  isChunkLoadError,
  reloadOnceAfterChunkFailure,
  recoverFromChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Next.js turbopack chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 123",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError matches webpack-style messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("reloadOnceAfterChunkFailure reloads only once per session", () => {
  const storage = new Map();
  global.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  let reloadCount = 0;
  global.window = {
    location: { reload: () => reloadCount++ },
  };

  assert.equal(reloadOnceAfterChunkFailure(), true);
  assert.equal(reloadCount, 1);
  assert.ok(storage.has(CHUNK_RELOAD_STORAGE_KEY));

  assert.equal(reloadOnceAfterChunkFailure(), false);
  assert.equal(reloadCount, 1);

  delete global.sessionStorage;
  delete global.window;
});

test("recoverFromChunkLoadError triggers reload for chunk errors", () => {
  const storage = new Map();
  global.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  let reloaded = false;
  global.window = {
    location: { reload: () => { reloaded = true; } },
  };

  const chunkError = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(recoverFromChunkLoadError(chunkError), true);
  assert.equal(reloaded, true);

  delete global.sessionStorage;
  delete global.window;
});
