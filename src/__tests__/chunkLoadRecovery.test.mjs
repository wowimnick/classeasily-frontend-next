import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  shouldDropChunkLoadErrorFromSentry,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893";
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(message), true);
});

test("isChunkLoadError detects webpack ChunkLoadError", () => {
  const error = new Error("Loading chunk 42 failed.");
  error.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("shouldDropChunkLoadErrorFromSentry filters matching Sentry events", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/example.js");
  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      {
        exception: {
          values: [{ value: error.message }],
        },
      },
      { originalException: error },
    ),
    true,
  );
});

test("shouldDropChunkLoadErrorFromSentry keeps unrelated Sentry events", () => {
  const error = new Error("Cannot read properties of undefined");
  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      {
        exception: {
          values: [{ value: error.message }],
        },
      },
      { originalException: error },
    ),
    false,
  );
});
