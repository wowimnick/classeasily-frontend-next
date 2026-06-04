/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyCrawler,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Next/Turbopack chunk failures", () => {
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

test("isLikelyCrawler detects GoogleOther and Googlebot", () => {
  assert.equal(
    isLikelyCrawler(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawler(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawler(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk errors", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        },
      ],
    },
    tags: { "browser.name": "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
});
