/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  getErrorMessage,
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack message", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
  );
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError matches ChunkLoadError name", () => {
  const err = new Error("network");
  err.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
});

test("isCrawlerUserAgent detects GoogleOther", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
});

test("shouldDropChunkLoadSentryEvent for crawler browser tag", () => {
  const event = {
    message: "Failed to load chunk /_next/static/chunks/x.js",
    tags: { "browser.name": "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
});

test("getErrorMessage handles strings and Error objects", () => {
  assert.equal(getErrorMessage("Failed to load chunk"), "Failed to load chunk");
  assert.equal(getErrorMessage(new Error("x")), "x");
});

test("exports stable session key", () => {
  assert.equal(CHUNK_RELOAD_SESSION_KEY, "ce-chunk-load-reload-attempted");
});
