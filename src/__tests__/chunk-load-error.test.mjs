/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  isKnownCrawlerUserAgent,
  reloadOnceForChunkError,
  shouldDropChunkLoadSentryEvent,
  shouldSuppressChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_xyz from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isKnownCrawlerUserAgent detects GoogleOther and Googlebot", () => {
  assert.equal(
    isKnownCrawlerUserAgent(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36 Chrome/141.0.0.0",
    ),
    true,
  );
  assert.equal(
    isKnownCrawlerUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isKnownCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("reloadOnceForChunkError reloads only once per session", () => {
  const storage = {
    values: new Map(),
    getItem(key) {
      return this.values.get(key) ?? null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    },
  };

  let reloadCount = 0;
  globalThis.window = {
    location: {
      reload() {
        reloadCount += 1;
      },
    },
  };

  const error = new Error("Failed to load chunk /_next/static/chunks/a.js");

  assert.equal(reloadOnceForChunkError(storage), true);
  assert.equal(reloadCount, 1);
  assert.equal(storage.getItem(CHUNK_RELOAD_SESSION_KEY), "1");

  assert.equal(reloadOnceForChunkError(storage), false);
  assert.equal(reloadCount, 1);

  delete globalThis.window;
});

test("shouldSuppressChunkLoadError suppresses crawlers without reload", () => {
  const storage = {
    values: new Map(),
    getItem(key) {
      return this.values.get(key) ?? null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    },
  };

  let reloadCount = 0;
  globalThis.window = {
    location: {
      reload() {
        reloadCount += 1;
      },
    },
  };

  const error = new Error("Failed to load chunk /_next/static/chunks/a.js");
  const ua = "Mozilla/5.0 (compatible; GoogleOther)";

  assert.equal(
    shouldSuppressChunkLoadError(error, { userAgent: ua, storage }),
    true,
  );
  assert.equal(reloadCount, 0);
  assert.equal(storage.getItem(CHUNK_RELOAD_SESSION_KEY), null);

  delete globalThis.window;
});

test("shouldDropChunkLoadSentryEvent drops crawler-tagged chunk errors", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/a.js from module 1",
  );
  const event = {
    message: error.message,
    tags: { browser: "GoogleOther" },
  };

  assert.equal(shouldDropChunkLoadSentryEvent(event, { originalException: error }), true);
});

test("shouldDropChunkLoadSentryEvent drops non-crawler chunk errors after reload attempt", () => {
  const storage = {
    values: new Map([[CHUNK_RELOAD_SESSION_KEY, "1"]]),
    getItem(key) {
      return this.values.get(key) ?? null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    },
  };

  globalThis.sessionStorage = storage;

  const error = new Error("Failed to load chunk /_next/static/chunks/a.js");
  const event = { message: error.message, tags: { browser: "Chrome" } };

  assert.equal(shouldDropChunkLoadSentryEvent(event, { originalException: error }), true);

  delete globalThis.sessionStorage;
});
