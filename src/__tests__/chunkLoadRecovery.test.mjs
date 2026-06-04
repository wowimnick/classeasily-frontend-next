/**
 * Run: node --test src/__tests__/chunkLoadRecovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  isLikelyBotSentryEvent,
  reloadOnceForChunkError,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyBotSentryEvent flags crawler browser tags", () => {
  assert.equal(
    isLikelyBotSentryEvent({
      contexts: { browser: { name: "GoogleOther" } },
    }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({
      tags: { browser: "Chrome" },
    }),
    false,
  );
});

test("reloadOnceForChunkError reloads only once per session", () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  let reloadCount = 0;
  globalThis.window = {
    location: {
      reload: () => {
        reloadCount += 1;
      },
    },
  };

  storage.delete(CHUNK_RELOAD_SESSION_KEY);
  assert.equal(reloadOnceForChunkError(), true);
  assert.equal(reloadCount, 1);
  assert.equal(reloadOnceForChunkError(), false);
  assert.equal(reloadCount, 1);
});
