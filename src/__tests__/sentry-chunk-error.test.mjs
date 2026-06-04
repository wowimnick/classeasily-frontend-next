/**
 * Run: node --test src/__tests__/sentry-chunk-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isBotSentryEvent,
  isChunkLoadErrorMessage,
  isChunkLoadSentryEvent,
  shouldDropChunkLoadSentryEvent,
} from "../../sentry.chunk-errors.js";

test("isChunkLoadErrorMessage matches Turbopack and webpack signatures", () => {
  assert.equal(
    isChunkLoadErrorMessage(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadErrorMessage("TypeError: et.some is not a function"), false);
});

test("isChunkLoadSentryEvent reads exception values", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [{ value: "Failed to load chunk abc.js" }],
      },
    }),
    true,
  );
});

test("isBotSentryEvent detects GoogleOther and Googlebot UA", () => {
  assert.equal(
    isBotSentryEvent({
      tags: { "browser.name": "GoogleOther" },
    }),
    true,
  );
  assert.equal(
    isBotSentryEvent({
      request: { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } },
    }),
    true,
  );
  assert.equal(
    isBotSentryEvent({
      tags: { "browser.name": "Chrome" },
      request: { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } },
    }),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops bots and first-chance chunk errors", () => {
  const chunkEvent = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  };

  assert.equal(
    shouldDropChunkLoadSentryEvent({
      ...chunkEvent,
      tags: { "browser.name": "GoogleOther" },
    }),
    true,
  );

  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  assert.equal(shouldDropChunkLoadSentryEvent(chunkEvent), true);
  storage.set("ce_chunk_load_reload_attempted", "1");
  assert.equal(shouldDropChunkLoadSentryEvent(chunkEvent), false);

  delete globalThis.sessionStorage;
});
