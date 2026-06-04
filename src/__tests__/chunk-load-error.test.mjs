/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  isCrawlerSentryEvent,
  isLikelyCrawlerUserAgent,
  shouldReportChunkLoadErrorToSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ message: "Loading chunk 42 failed" }), true);
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
});

test("isLikelyCrawlerUserAgent detects common bots", () => {
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; GoogleOther)",
    ),
    true,
  );
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("isCrawlerSentryEvent uses Sentry browser tags", () => {
  assert.equal(
    isCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(isCrawlerSentryEvent({ tags: { browser: "Chrome" } }), false);
});

test("shouldReportChunkLoadErrorToSentry drops crawlers and scheduled reloads", () => {
  const chunkErr = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(
    shouldReportChunkLoadErrorToSentry({
      error: chunkErr,
      userAgent: "Googlebot/2.1",
    }),
    false,
  );
  assert.equal(
    shouldReportChunkLoadErrorToSentry({
      error: chunkErr,
      reloadScheduled: true,
    }),
    false,
  );
  assert.equal(
    shouldReportChunkLoadErrorToSentry({
      error: chunkErr,
      userAgent: "Mozilla/5.0 Chrome/120",
    }),
    true,
  );
  assert.equal(
    shouldReportChunkLoadErrorToSentry({
      event: {
        exception: {
          values: [{ value: "Failed to load chunk foo.js from module 1" }],
        },
        tags: { browser: "GoogleOther" },
      },
    }),
    false,
  );
});

test("isChunkLoadSentryEvent inspects exception values", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: { values: [{ value: "Failed to load chunk abc.js" }] },
    }),
    true,
  );
  assert.equal(isChunkLoadSentryEvent({ message: "TypeError: x" }), false);
});
