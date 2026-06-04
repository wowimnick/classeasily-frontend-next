/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  filterSentryEvent,
  isChunkLoadError,
  isCrawlerSentryEvent,
  isCrawlerUserAgent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("isCrawlerUserAgent detects common crawlers", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Mobile Safari/537.36 (compatible; GoogleOther)"
    ),
    true
  );
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    ),
    false
  );
});

test("isCrawlerSentryEvent uses browser tag from Sentry", () => {
  assert.equal(
    isCrawlerSentryEvent({
      tags: { "browser.name": "GoogleOther" },
    }),
    true
  );
  assert.equal(
    isCrawlerSentryEvent({
      tags: { browser: "Chrome 120" },
      contexts: { browser: { name: "Chrome" } },
    }),
    false
  );
});

test("filterSentryEvent drops crawler chunk errors", () => {
  const event = {
    message:
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    tags: { "browser.name": "GoogleOther" },
  };
  assert.equal(filterSentryEvent(event, {}), null);
});

test("filterSentryEvent drops first-attempt chunk errors for real browsers", () => {
  const event = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        },
      ],
    },
    tags: { "browser.name": "Chrome" },
  };
  assert.equal(filterSentryEvent(event, {}), null);
});
