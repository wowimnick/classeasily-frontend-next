/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getEventBrowserName,
  isChunkLoadError,
  isCrawlerBrowserName,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack stale chunk messages", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
  );
  assert.equal(isChunkLoadError(err), true);
  assert.equal(isChunkLoadError({ message: "Loading chunk 42 failed" }), true);
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
});

test("isCrawlerBrowserName recognizes GoogleOther and generic bots", () => {
  assert.equal(isCrawlerBrowserName("GoogleOther"), true);
  assert.equal(isCrawlerBrowserName("Googlebot"), true);
  assert.equal(isCrawlerBrowserName("Chrome"), false);
  assert.equal(isCrawlerBrowserName("SomethingSpider"), true);
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk errors", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
    tags: { browser: "GoogleOther" },
  };
  const hint = {
    originalException: new Error(event.exception.values[0].value),
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, hint), true);
});

test("shouldDropChunkLoadSentryEvent keeps non-chunk errors", () => {
  const event = { tags: { browser: "GoogleOther" } };
  const hint = { originalException: new Error("TypeError: x is not a function") };
  assert.equal(shouldDropChunkLoadSentryEvent(event, hint), false);
});

test("getEventBrowserName reads Sentry browser tag", () => {
  assert.equal(getEventBrowserName({ tags: { browser: "GoogleOther" } }), "GoogleOther");
  assert.equal(
    getEventBrowserName({ contexts: { browser: { name: "Chrome" } } }),
    "Chrome",
  );
});
