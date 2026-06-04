/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CHUNK_LOAD_ERROR_PATTERN,
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  isLikelyBotSentryEvent,
  isLikelyBotUserAgent,
  shouldDropChunkLoadErrorFromSentry,
} from "../lib/chunk-load-error.js";

test("CHUNK_LOAD_ERROR_PATTERN matches Turbopack and webpack chunk failures", () => {
  assert.match(
    "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
    CHUNK_LOAD_ERROR_PATTERN,
  );
  assert.match("Loading chunk 42 failed", CHUNK_LOAD_ERROR_PATTERN);
  assert.match("ChunkLoadError: something broke", CHUNK_LOAD_ERROR_PATTERN);
  assert.doesNotMatch("Network request failed", CHUNK_LOAD_ERROR_PATTERN);
});

test("isChunkLoadError detects Error objects and strings", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
    ),
    true,
  );
  assert.equal(
    isChunkLoadError("Failed to load chunk /_next/static/chunks/abc.js"),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Something else")), false);
});

test("isLikelyBotUserAgent flags crawlers", () => {
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    true,
  );
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; GoogleOther)",
    ),
    true,
  );
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("isLikelyBotSentryEvent uses Sentry browser tags", () => {
  assert.equal(
    isLikelyBotSentryEvent({
      tags: { browser: "GoogleOther" },
    }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({
      contexts: { browser: { name: "Googlebot" } },
    }),
    true,
  );
  assert.equal(
    isLikelyBotSentryEvent({
      tags: { browser: "Chrome" },
    }),
    false,
  );
});

test("shouldDropChunkLoadErrorFromSentry drops bot chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 1",
  );

  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      { tags: { browser: "GoogleOther" } },
      { originalException: error },
    ),
    true,
  );
});

test("shouldDropChunkLoadErrorFromSentry drops first real-user chunk failure before reload", () => {
  global.window = {
    sessionStorage: {
      getItem(key) {
        assert.equal(key, CHUNK_RELOAD_SESSION_KEY);
        return null;
      },
    },
  };

  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 1",
  );

  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      { tags: { browser: "Chrome" } },
      { originalException: error },
    ),
    true,
  );

  delete global.window;
});

test("shouldDropChunkLoadErrorFromSentry keeps real-user chunk failure after reload attempt", () => {
  global.window = {
    sessionStorage: {
      getItem(key) {
        assert.equal(key, CHUNK_RELOAD_SESSION_KEY);
        return "1717500602000";
      },
    },
  };

  const error = new Error(
    "Failed to load chunk /_next/static/chunks/abc.js from module 1",
  );

  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      { tags: { browser: "Chrome" } },
      { originalException: error },
    ),
    false,
  );

  delete global.window;
});

test("shouldDropChunkLoadErrorFromSentry ignores unrelated errors", () => {
  assert.equal(
    shouldDropChunkLoadErrorFromSentry(
      { tags: { browser: "Chrome" } },
      { originalException: new Error("TypeError: x is not a function") },
    ),
    false,
  );
});
