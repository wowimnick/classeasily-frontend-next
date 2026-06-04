/**
 * Run: node --test src/__tests__/sentry-chunk-errors.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/sentry-chunk-errors.js";

test("isChunkLoadError matches Turbopack stale chunk messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError("Something else failed"), false);
});

test("isLikelyCrawlerUserAgent detects Google crawler signatures", () => {
  assert.equal(isLikelyCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawlerUserAgent(
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
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        },
      ],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
});

test("shouldDropChunkLoadSentryEvent keeps real-user chunk errors", () => {
  const event = {
    exception: {
      values: [
        {
          value: "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        },
      ],
    },
    tags: { browser: "Chrome" },
    request: {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), false);
});
