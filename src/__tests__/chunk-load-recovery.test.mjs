/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  getChunkLoadErrorMessage,
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_xyz from module 123",
  );
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError detects webpack chunk failures", () => {
  const error = new Error("Loading chunk 42 failed.");
  assert.equal(isChunkLoadError(error), true);
});

test("isChunkLoadError ignores unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("getChunkLoadErrorMessage includes nested cause", () => {
  const cause = new Error("Failed to load chunk /_next/static/chunks/a.js");
  const error = new Error("Dynamic import failed", { cause });
  assert.match(getChunkLoadErrorMessage(error), /Failed to load chunk/);
});

test("shouldDropChunkLoadSentryEvent drops chunk load events", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
});

test("shouldDropChunkLoadSentryEvent keeps unrelated events", () => {
  const event = {
    exception: {
      values: [{ value: "TypeError: Cannot read properties of undefined" }],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), false);
});
