/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerBrowser,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed."), true);
  assert.equal(isChunkLoadError("ChunkLoadError: Loading chunk failed"), true);
  assert.equal(
    isChunkLoadError("Importing a module script failed"),
    true,
  );
  assert.equal(isChunkLoadError("TypeError: et.some is not a function"), false);
});

test("isCrawlerBrowser identifies GoogleOther", () => {
  assert.equal(isCrawlerBrowser("GoogleOther"), true);
  assert.equal(isCrawlerBrowser("Chrome"), false);
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk failures only", () => {
  const crawlerChunkEvent = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/foo.js from module 1",
        },
      ],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(crawlerChunkEvent), true);

  const userChunkEvent = {
    ...crawlerChunkEvent,
    tags: { browser: "Chrome" },
    contexts: { browser: { name: "Chrome" } },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(userChunkEvent), false);

  const crawlerOtherError = {
    exception: { values: [{ value: "TypeError: x is not a function" }] },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(crawlerOtherError), false);
});
