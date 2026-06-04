import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isCrawlerChunkLoadSentryEvent drops GoogleOther crawler noise", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        },
      ],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(isCrawlerChunkLoadSentryEvent(event), true);
});

test("isCrawlerChunkLoadSentryEvent keeps real-user chunk failures", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        },
      ],
    },
    tags: { browser: "Chrome 137.0.0" },
  };
  assert.equal(isCrawlerChunkLoadSentryEvent(event), false);
});
