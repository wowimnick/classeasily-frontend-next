/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_STORAGE_KEY,
  getChunkLoadErrorMessage,
  handleClientChunkLoadFailure,
  isChunkLoadError,
  shouldDropChunkLoadFromSentry,
  shouldReloadForChunkError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("getChunkLoadErrorMessage includes Error.cause", () => {
  const err = new Error("wrapper", {
    cause: new Error("Failed to load chunk abc.js"),
  });
  assert.match(getChunkLoadErrorMessage(err), /Failed to load chunk/);
});

test("shouldDropChunkLoadFromSentry uses event exception text", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  };
  assert.equal(shouldDropChunkLoadFromSentry(event, null), true);
  assert.equal(
    shouldDropChunkLoadFromSentry({ message: "TypeError: x is not a function" }, null),
    false
  );
});

test("shouldReloadForChunkError respects session cooldown", () => {
  const storage = {
    data: {},
    getItem(key) {
      return this.data[key] ?? null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
  };
  assert.equal(shouldReloadForChunkError(storage), true);
  storage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now()));
  assert.equal(shouldReloadForChunkError(storage), false);
  storage.setItem(
    CHUNK_RELOAD_STORAGE_KEY,
    String(Date.now() - CHUNK_RELOAD_COOLDOWN_MS - 1)
  );
  assert.equal(shouldReloadForChunkError(storage), true);
});

test("handleClientChunkLoadFailure returns false without window", () => {
  assert.equal(handleClientChunkLoadFailure(), false);
});
