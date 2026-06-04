/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadErrorEvent,
} from "../../sentry.shared.config.js";

test("isChunkLoadError matches Next.js / Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isCrawlerUserAgent detects common crawlers", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(
    isCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
    ),
    false,
  );
});

test("shouldDropChunkLoadErrorEvent drops crawler chunk failures", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  };
  assert.equal(
    shouldDropChunkLoadErrorEvent(event, null, {
      userAgent: "Mozilla/5.0 (compatible; GoogleOther)",
    }),
    true,
  );
});

test("shouldDropChunkLoadErrorEvent drops first real-user chunk failure before reload", () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
    },
  };

  assert.equal(
    shouldDropChunkLoadErrorEvent(event, null, {
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
    }),
    true,
  );

  storage.set("classeasily-chunk-reload", "1");
  assert.equal(
    shouldDropChunkLoadErrorEvent(event, null, {
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
    }),
    false,
  );

  delete globalThis.sessionStorage;
});

test("getErrorMessage handles common shapes", () => {
  assert.equal(getErrorMessage("plain text"), "plain text");
  assert.equal(getErrorMessage(new Error("boom")), "boom");
  assert.equal(getErrorMessage({ message: "obj" }), "obj");
});
