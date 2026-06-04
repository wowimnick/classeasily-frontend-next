/**
 * Run: node --test src/__tests__/chunkLoadError.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadError.js";

test("isChunkLoadError matches Turbopack / Next chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("shouldDropChunkLoadSentryEvent filters matching Sentry payloads", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/foo.js from module 1",
        },
      ],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: "Something else" }] } },
      {},
    ),
    false,
  );
});
