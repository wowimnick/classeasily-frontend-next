import assert from "node:assert/strict";
import test from "node:test";
import {
  getChunkLoadErrorMessage,
  isChunkLoadError,
  isCrawlerContext,
  isLikelyCrawlerUserAgent,
  shouldSuppressChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js from module 123",
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 5 failed"), true);
  assert.equal(isChunkLoadError("TypeError: et.some is not a function"), false);
});

test("isCrawlerContext detects GoogleOther and bot user agents", () => {
  assert.equal(isCrawlerContext({ browser: "GoogleOther" }), true);
  assert.equal(
    isCrawlerContext({}, "Mozilla/5.0 (compatible; Googlebot/2.1)"),
    true,
  );
  assert.equal(isCrawlerContext({ browser: "Chrome" }), false);
});

test("shouldSuppressChunkLoadSentryEvent drops crawler chunk errors only", () => {
  const chunkMessage =
    "Failed to load chunk /_next/static/chunks/x.js from module 1";
  const crawlerEvent = {
    tags: { browser: "GoogleOther" },
    exception: { values: [{ value: chunkMessage }] },
  };
  const userEvent = {
    tags: { browser: "Chrome" },
    exception: { values: [{ value: chunkMessage }] },
  };

  assert.equal(
    shouldSuppressChunkLoadSentryEvent(crawlerEvent, {
      originalException: new Error(chunkMessage),
    }),
    true,
  );
  assert.equal(
    shouldSuppressChunkLoadSentryEvent(userEvent, {
      originalException: new Error(chunkMessage),
    }),
    false,
  );
  assert.equal(
    shouldSuppressChunkLoadSentryEvent(userEvent, {
      originalException: new Error("TypeError: x"),
    }),
    false,
  );
});

test("getChunkLoadErrorMessage normalizes Error and string reasons", () => {
  assert.equal(getChunkLoadErrorMessage(new Error("chunk fail")), "chunk fail");
  assert.equal(getChunkLoadErrorMessage("chunk fail"), "chunk fail");
});

test("isLikelyCrawlerUserAgent", () => {
  assert.equal(isLikelyCrawlerUserAgent("GoogleOther"), true);
  assert.equal(isLikelyCrawlerUserAgent("Mozilla/5.0 Chrome"), false);
});
