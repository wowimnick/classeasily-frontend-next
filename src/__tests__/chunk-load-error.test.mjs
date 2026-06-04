/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadError,
  isNextChunkAssetUrl,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 964893",
    ),
    true,
  );
});

test("isChunkLoadError detects webpack-style chunk failures", () => {
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError("Network request failed"), false);
});

test("isNextChunkAssetUrl matches Next chunk URLs", () => {
  assert.equal(
    isNextChunkAssetUrl("/_next/static/chunks/25d5818057eb0fb6.js"),
    true,
  );
  assert.equal(isNextChunkAssetUrl("/assets/logo.png"), false);
});

test("shouldDropChunkLoadSentryEvent filters chunk load issues", () => {
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: {
        values: [
          {
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
      message: "TypeError: Cannot read properties of undefined",
    }),
    false,
  );
});
