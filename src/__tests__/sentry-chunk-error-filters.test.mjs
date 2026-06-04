/**
 * Run: node --test src/__tests__/sentry-chunk-error-filters.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_LOAD_ERROR_RE,
  isCrawlerBrowserTag,
  isCrawlerUserAgent,
  shouldDropSentryEvent,
} from "../../sentry.shared.config.js";

test("CHUNK_LOAD_ERROR_RE matches Turbopack chunk failures", () => {
  assert.match(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    CHUNK_LOAD_ERROR_RE
  );
  assert.match("Loading chunk 42 failed", CHUNK_LOAD_ERROR_RE);
  assert.doesNotMatch("Network request failed", CHUNK_LOAD_ERROR_RE);
});

test("isCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    ),
    true
  );
  assert.equal(isCrawlerUserAgent("GoogleOther"), true);
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 Chrome/41.0"
    ),
    false
  );
});

test("shouldDropSentryEvent drops GoogleOther chunk errors", () => {
  const event = {
    tags: { browser: "GoogleOther" },
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
        },
      ],
    },
  };
  assert.equal(shouldDropSentryEvent(event), true);
});

test("shouldDropSentryEvent keeps real-user chunk errors", () => {
  const event = {
    tags: { browser: "Chrome 120" },
    exception: {
      values: [
        {
          value: "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        },
      ],
    },
    request: {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    },
  };
  assert.equal(shouldDropSentryEvent(event), false);
});

test("isCrawlerBrowserTag", () => {
  assert.equal(isCrawlerBrowserTag("GoogleOther"), true);
  assert.equal(isCrawlerBrowserTag("Chrome 120"), false);
});
