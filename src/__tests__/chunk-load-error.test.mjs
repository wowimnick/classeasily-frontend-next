/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  sentryBeforeSendChunkFilter,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isChunkLoadSentryEvent reads exception value", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/foo.js" }],
      },
    }),
    true,
  );
  assert.equal(isChunkLoadSentryEvent({ exception: { values: [{ value: "Other" }] } }), false);
});

test("sentryBeforeSendChunkFilter drops chunk events", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
  };
  assert.equal(sentryBeforeSendChunkFilter(event, {}), null);
  const other = { exception: { values: [{ value: "TypeError: x" }] } };
  assert.deepEqual(sentryBeforeSendChunkFilter(other, {}), other);
});
