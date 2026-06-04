/**
 * Run: node --test src/__tests__/chunkLoadRecovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isKnownCrawlerUserAgent,
  isStaleChunkLoadError,
  shouldDropChunkLoadErrorFromSentry,
} from "../lib/chunkLoadRecovery.js";

test("isStaleChunkLoadError matches Next/Turbopack chunk failures", () => {
  assert.equal(
    isStaleChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893"
      )
    ),
    true
  );
  assert.equal(isStaleChunkLoadError(new Error("Network request failed")), false);
});

test("isKnownCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(isKnownCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
  assert.equal(isKnownCrawlerUserAgent("Mozilla/5.0 Chrome/120.0"), false);
});

test("getErrorMessage normalizes strings and Error objects", () => {
  assert.equal(getErrorMessage("hello"), "hello");
  assert.equal(getErrorMessage(new Error("boom")), "boom");
});

test("shouldDropChunkLoadErrorFromSentry drops crawler chunk failures", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 1",
        },
      ],
    },
    contexts: { browser: { name: "GoogleOther" } },
  };
  assert.equal(shouldDropChunkLoadErrorFromSentry(event, {}), true);
});

test("shouldDropChunkLoadErrorFromSentry keeps non-chunk errors", () => {
  const event = {
    exception: { values: [{ value: "TypeError: x is not a function" }] },
  };
  assert.equal(shouldDropChunkLoadErrorFromSentry(event, {}), false);
});
