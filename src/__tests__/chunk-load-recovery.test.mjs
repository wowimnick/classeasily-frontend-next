/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isStaleChunkLoadError,
  isStaleChunkLoadMessage,
  markChunkReloadAttempted,
  shouldAttemptChunkReload,
  tryRecoverFromStaleChunkLoad,
} from "../lib/chunk-load-recovery.js";

test("isStaleChunkLoadMessage matches Next/Turbopack chunk failures", () => {
  assert.equal(
    isStaleChunkLoadMessage(
      "Failed to load chunk /_next/static/chunks/abc.js from module 1",
    ),
    true,
  );
  assert.equal(isStaleChunkLoadMessage("Loading chunk 123 failed"), true);
  assert.equal(isStaleChunkLoadMessage("ChunkLoadError: something"), true);
  assert.equal(isStaleChunkLoadMessage("Network request failed"), false);
});

test("isStaleChunkLoadError checks nested causes", () => {
  const err = new Error("wrapper");
  err.cause = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(isStaleChunkLoadError(err), true);
});

test("tryRecoverFromStaleChunkLoad reloads only once per session", () => {
  const storage = new Map();
  const storageApi = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
  };
  let reloadCount = 0;
  const reload = () => {
    reloadCount += 1;
  };

  assert.equal(
    tryRecoverFromStaleChunkLoad("Failed to load chunk abc", {
      storage: storageApi,
      reload,
    }),
    true,
  );
  assert.equal(reloadCount, 1);
  assert.equal(storage.get(CHUNK_RELOAD_SESSION_KEY), "1");

  assert.equal(
    tryRecoverFromStaleChunkLoad("Failed to load chunk abc", {
      storage: storageApi,
      reload,
    }),
    false,
  );
  assert.equal(reloadCount, 1);
});

test("shouldAttemptChunkReload respects session flag", () => {
  const storage = new Map();
  const storageApi = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
  };
  assert.equal(shouldAttemptChunkReload(storageApi), true);
  markChunkReloadAttempted(storageApi);
  assert.equal(shouldAttemptChunkReload(storageApi), false);
});
