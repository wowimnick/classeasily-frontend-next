/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getChunkLoadErrorMessage,
  isChunkLoadError,
  isCrawlerSentryEvent,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack deployment mismatch messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Something else broke")), false);
});

test("getChunkLoadErrorMessage handles strings and Error objects", () => {
  assert.equal(getChunkLoadErrorMessage("plain"), "plain");
  assert.equal(
    getChunkLoadErrorMessage(new Error("msg")),
    "msg",
  );
});

test("isCrawlerUserAgent detects common crawlers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("isCrawlerSentryEvent detects GoogleOther browser tag", () => {
  assert.equal(
    isCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(
    isCrawlerSentryEvent({ tags: { browser: "Chrome 120" } }),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops chunk events", () => {
  const event = {
    title:
      "Failed to load chunk /_next/static/chunks/foo.js from module 1",
  };
  const hint = {
    originalException: new Error(event.title),
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, hint), true);
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { title: "TypeError: x is not a function" },
      { originalException: new Error("TypeError: x is not a function") },
    ),
    false,
  );
});
