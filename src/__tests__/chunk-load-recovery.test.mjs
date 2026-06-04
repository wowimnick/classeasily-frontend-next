/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError detects Turbopack stale chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed."), true);
  assert.equal(isChunkLoadError("Loading CSS chunk 9 failed."), true);
  assert.equal(isChunkLoadError("ChunkLoadError: something"), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError("Failed to load widget settings."), false);
  assert.equal(isChunkLoadError(""), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isChunkLoadSentryEvent matches Sentry exception payloads", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/example.js from module 1",
          },
        ],
      },
    }),
    true,
  );

  assert.equal(
    isChunkLoadSentryEvent({
      message: "Loading chunk 12 failed.",
    }),
    true,
  );

  assert.equal(isChunkLoadSentryEvent({ message: "Network request failed" }), false);
});
