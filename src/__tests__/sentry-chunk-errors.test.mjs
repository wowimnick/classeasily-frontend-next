/**
 * Run: node --test src/__tests__/sentry-chunk-errors.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  isChunkLoadMessage,
  CHUNK_RELOAD_SESSION_KEY,
} from "../lib/chunk-load-recovery.js";
import {
  isChunkLoadSentryEvent,
  isKnownCrawlerBrowser,
  isLikelyCrawlerEvent,
  sentryBeforeSend,
} from "../../sentry.shared.config.js";

test("isChunkLoadMessage detects turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadMessage(
      "Failed to load chunk /_next/static/chunks/abc.js from module 123"
    ),
    true
  );
  assert.equal(isChunkLoadMessage("Network request failed"), false);
});

test("isKnownCrawlerBrowser matches Google crawler tags", () => {
  assert.equal(isKnownCrawlerBrowser("GoogleOther"), true);
  assert.equal(isKnownCrawlerBrowser("Chrome"), false);
});

test("isChunkLoadSentryEvent reads exception value", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
    }),
    true
  );
});

test("isLikelyCrawlerEvent uses browser tag from Sentry event", () => {
  assert.equal(
    isLikelyCrawlerEvent({ tags: { browser: "GoogleOther" } }),
    true
  );
});

test("sentryBeforeSend drops chunk load errors", () => {
  const event = {
    tags: { browser: "Chrome" },
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        },
      ],
    },
  };
  assert.equal(sentryBeforeSend(event, {}), null);
});

test("sentryBeforeSend drops crawler chunk errors explicitly", () => {
  const event = {
    tags: { browser: "GoogleOther" },
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  };
  assert.equal(sentryBeforeSend(event, {}), null);
});

test("sentryBeforeSend keeps unrelated errors", () => {
  const event = {
    tags: { browser: "Chrome" },
    exception: { values: [{ value: "TypeError: Cannot read properties of null" }] },
  };
  assert.equal(sentryBeforeSend(event, {}), event);
});

test("CHUNK_RELOAD_SESSION_KEY is exported for instrumentation", () => {
  assert.equal(typeof CHUNK_RELOAD_SESSION_KEY, "string");
  assert.ok(CHUNK_RELOAD_SESSION_KEY.length > 0);
});
