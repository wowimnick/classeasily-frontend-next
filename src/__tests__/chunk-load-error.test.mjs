import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack stale chunk message", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError matches wrapped cause", () => {
  const cause = new Error("Loading chunk 12 failed");
  const error = new Error("dynamic import failed", { cause });
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Failed to load widget settings.")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("shouldDropChunkLoadSentryEvent uses hint and event payload", () => {
  const chunkError = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: chunkError.message }] } },
      { originalException: chunkError },
    ),
    true,
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: "Network request failed" }, {}),
    false,
  );
});
