/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
  );
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError detects classic webpack ChunkLoadError", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError("ChunkLoadError: something"), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("shouldDropChunkLoadSentryEvent matches Sentry exception payload", () => {
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/foo.js from module 1",
          },
        ],
      },
    }),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: { values: [{ value: "TypeError: x is not a function" }] },
    }),
    false,
  );
});
