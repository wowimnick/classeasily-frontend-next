/**
 * Run: node --test src/__tests__/sentry-chunk-load.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getChunkLoadIgnorePatterns,
  isChunkLoadErrorMessage,
  isLikelyBotSentryEvent,
  sentryBeforeSend,
} from "../../sentry.shared.config.js";

test("isChunkLoadErrorMessage matches Turbopack / webpack stale chunk errors", () => {
  assert.equal(
    isChunkLoadErrorMessage(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadErrorMessage("ChunkLoadError"), true);
  assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
  assert.equal(isChunkLoadErrorMessage(""), false);
});

test("isLikelyBotSentryEvent detects crawler browser tags", () => {
  assert.equal(
    isLikelyBotSentryEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({ contexts: { browser: { name: "Googlebot" } } }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({ tags: { browser: "Chrome" } }),
    false,
  );
});

test("sentryBeforeSend drops chunk load errors", () => {
  const chunkEvent = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        },
      ],
    },
    tags: { browser: "Chrome" },
  };
  assert.equal(sentryBeforeSend(chunkEvent, {}), null);

  const botChunkEvent = {
    ...chunkEvent,
    tags: { browser: "GoogleOther" },
  };
  assert.equal(sentryBeforeSend(botChunkEvent, {}), null);

  const realBug = {
    exception: { values: [{ value: "TypeError: et.some is not a function" }] },
  };
  assert.equal(sentryBeforeSend(realBug, {}), realBug);
});

test("getChunkLoadIgnorePatterns returns regex list for ignoreErrors", () => {
  const patterns = getChunkLoadIgnorePatterns();
  assert.equal(patterns.length, 1);
  assert.match(
    "Failed to load chunk foo",
    patterns[0],
  );
});
