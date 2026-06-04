/**
 * Run: node --test src/__tests__/stale-chunk-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isStaleChunkLoadError,
  isStaleChunkSentryEvent,
} from "../lib/stale-chunk-recovery.js";

test("isStaleChunkLoadError matches Turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_xyz from module 964893";
  assert.equal(isStaleChunkLoadError(new Error(message)), true);
  assert.equal(isStaleChunkLoadError(message), true);
});

test("isStaleChunkLoadError matches webpack-style chunk failures", () => {
  assert.equal(isStaleChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isStaleChunkLoadError(new Error("ChunkLoadError")), true);
});

test("isStaleChunkLoadError ignores unrelated errors", () => {
  assert.equal(isStaleChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isStaleChunkLoadError(null), false);
});

test("getErrorMessage includes error cause", () => {
  const err = new Error("Failed to load chunk abc");
  err.cause = new Error("404 Not Found");
  assert.match(getErrorMessage(err), /404 Not Found/);
});

test("isStaleChunkSentryEvent filters Sentry exception payloads", () => {
  const event = {
    exception: {
      values: [
        {
          type: "Error",
          value:
            "Failed to load chunk /_next/static/chunks/foo.js from module 1",
        },
      ],
    },
  };
  assert.equal(isStaleChunkSentryEvent(event), true);
  assert.equal(isStaleChunkSentryEvent({ message: "Unhandled rejection" }), false);
});
