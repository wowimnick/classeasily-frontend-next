/**
 * Run: node --test src/__tests__/stale-chunk-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  clearStaleChunkReloadGuard,
  getStaleChunkErrorMessage,
  isStaleChunkLoadError,
  STALE_CHUNK_RELOAD_COOLDOWN_MS,
  STALE_CHUNK_RELOAD_KEY,
  sentryBeforeSendForStaleChunks,
  tryRecoverFromStaleChunk,
} from "../lib/stale-chunk-recovery.js";

test("isStaleChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isStaleChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js from module 123"
    ),
    true
  );
  assert.equal(isStaleChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isStaleChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isStaleChunkLoadError("TypeError: Cannot read properties"), false);
});

test("getStaleChunkErrorMessage extracts from Error and strings", () => {
  assert.equal(getStaleChunkErrorMessage(new Error("chunk fail")), "chunk fail");
  assert.equal(getStaleChunkErrorMessage("plain"), "plain");
});

test("tryRecoverFromStaleChunk reloads once per cooldown window", () => {
  const storage = new Map();
  let reloaded = 0;
  const win = {
    sessionStorage: {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
    location: { reload: () => { reloaded += 1; } },
  };

  assert.equal(tryRecoverFromStaleChunk(win, 1_000), true);
  assert.equal(reloaded, 1);
  assert.equal(storage.get(STALE_CHUNK_RELOAD_KEY), "1000");

  assert.equal(tryRecoverFromStaleChunk(win, 2_000), false);
  assert.equal(reloaded, 1);

  assert.equal(
    tryRecoverFromStaleChunk(win, 1_000 + STALE_CHUNK_RELOAD_COOLDOWN_MS + 1),
    true
  );
  assert.equal(reloaded, 2);
});

test("clearStaleChunkReloadGuard removes session key", () => {
  const storage = new Map([[STALE_CHUNK_RELOAD_KEY, "1"]]);
  const win = {
    sessionStorage: {
      removeItem: (k) => storage.delete(k),
    },
  };
  clearStaleChunkReloadGuard(win);
  assert.equal(storage.has(STALE_CHUNK_RELOAD_KEY), false);
});

test("sentryBeforeSendForStaleChunks suppresses until reload cooldown expires", () => {
  const event = {
    message: "Failed to load chunk /_next/static/chunks/x.js",
    exception: { values: [{ value: "Failed to load chunk" }] },
  };
  const hint = {
    originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
  };

  globalThis.window = {
    sessionStorage: {
      getItem: () => null,
    },
  };
  assert.equal(sentryBeforeSendForStaleChunks(event, hint), null);

  const recentReload = String(Date.now());
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (k === STALE_CHUNK_RELOAD_KEY ? recentReload : null),
    },
  };
  assert.equal(sentryBeforeSendForStaleChunks(event, hint), null);

  const expiredReload = String(Date.now() - STALE_CHUNK_RELOAD_COOLDOWN_MS - 1);
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (k === STALE_CHUNK_RELOAD_KEY ? expiredReload : null),
    },
  };
  assert.equal(sentryBeforeSendForStaleChunks(event, hint), event);

  delete globalThis.window;
});
