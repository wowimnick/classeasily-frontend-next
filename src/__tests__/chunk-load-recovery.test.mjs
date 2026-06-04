/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_xyz from module 123",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("shouldDropChunkLoadSentryEvent drops chunk errors from Sentry", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/abc.js");
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: error.message }, { originalException: error }),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: error.message }] } },
      {},
    ),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: "TypeError: x is not a function" }, {}),
    false,
  );
});
