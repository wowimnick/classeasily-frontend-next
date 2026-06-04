import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_STORAGE_KEY,
  isChunkLoadError,
  isCrawlerSentryEvent,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../../sentry-chunk-errors.js";

test("isChunkLoadError matches Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Something else")), false);
});

test("isCrawlerUserAgent detects Google crawlers", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 Chrome/120.0"), false);
});

test("isCrawlerSentryEvent uses browser tags", () => {
  assert.equal(
    isCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(
    isCrawlerSentryEvent({ contexts: { browser: { name: "Chrome" } } }),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk errors", () => {
  const event = {
    tags: { browser: "GoogleOther" },
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/foo.js from module 1",
        },
      ],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
});

test("CHUNK_RELOAD_STORAGE_KEY is stable", () => {
  assert.equal(CHUNK_RELOAD_STORAGE_KEY, "sentry-chunk-reload-attempted");
});
