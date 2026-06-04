/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  shouldDropChunkLoadErrorFromSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_test from module 964893",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isChunkLoadError(new Error("Loading CSS chunk 7 failed.")), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isChunkLoadError checks error.cause", () => {
  const error = new Error("Wrapper");
  error.cause = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  assert.equal(isChunkLoadError(error), true);
});

test("shouldDropChunkLoadErrorFromSentry filters matching Sentry events", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  const event = {
    exception: {
      values: [{ value: error.message }],
    },
  };

  assert.equal(shouldDropChunkLoadErrorFromSentry(event, { originalException: error }), true);
  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      { exception: { values: [{ value: "TypeError: x is not a function" }] } },
      { originalException: new Error("TypeError: x is not a function") },
    ),
    false,
  );
});
