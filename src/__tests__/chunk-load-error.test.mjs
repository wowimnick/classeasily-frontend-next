/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack / webpack stale chunk messages", () => {
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
  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module")),
    true,
  );
});

test("isChunkLoadError ignores unrelated failures", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("shouldDropChunkLoadSentryEvent filters matching exception payloads", () => {
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Failed to load chunk /_next/static/chunks/abc.js from module 1",
          },
        ],
      },
    }),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: { values: [{ type: "TypeError", value: "x.some is not a function" }] },
    }),
    false,
  );
});
