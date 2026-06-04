/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  isCrawlerUserAgent,
  shouldSuppressChunkLoadReport,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isCrawlerUserAgent matches Google crawlers", () => {
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36",
    ),
    true,
  );
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("isChunkLoadSentryEvent reads exception values", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js",
          },
        ],
      },
    }),
    true,
  );
});

test("shouldSuppressChunkLoadReport drops crawler chunk errors", () => {
  assert.equal(
    shouldSuppressChunkLoadReport({
      userAgent: "Mozilla/5.0 (compatible; GoogleOther)",
      hasRecoveryAttempt: false,
    }),
    true,
  );
  assert.equal(
    shouldSuppressChunkLoadReport({
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
      hasRecoveryAttempt: true,
    }),
    false,
  );
});
