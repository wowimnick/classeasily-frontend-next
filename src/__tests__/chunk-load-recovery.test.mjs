/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  filterChunkLoadSentryEvent,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("filterChunkLoadSentryEvent drops chunk failures", () => {
  const dropped = filterChunkLoadSentryEvent({
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  });
  assert.equal(dropped, null);

  const kept = filterChunkLoadSentryEvent({
    exception: { values: [{ value: "TypeError: x is not a function" }] },
  });
  assert.ok(kept);
});

test("tryRecoverFromChunkLoadError reloads once per session", () => {
  const storage = new Map();
  const mockStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };
  let reloadCount = 0;

  const reloaded = tryRecoverFromChunkLoadError(
    new Error("Failed to load chunk /_next/static/chunks/a.js"),
    {
      storage: mockStorage,
      reload: () => {
        reloadCount += 1;
      },
    },
  );

  assert.equal(reloaded, true);
  assert.equal(reloadCount, 1);
  assert.equal(mockStorage.getItem(CHUNK_RELOAD_SESSION_KEY), "1");

  const second = tryRecoverFromChunkLoadError(
    new Error("Failed to load chunk /_next/static/chunks/a.js"),
    {
      storage: mockStorage,
      reload: () => {
        reloadCount += 1;
      },
    },
  );

  assert.equal(second, false);
  assert.equal(reloadCount, 1);
});
