import assert from "node:assert/strict";
import test from "node:test";

import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_TS_KEY,
  attemptChunkLoadReload,
  getChunkErrorMessageFromSentryEvent,
  isChunkLoadError,
  isLikelyCrawler,
  isLikelyCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyCrawlerUserAgent flags GoogleOther-style agents", () => {
  assert.equal(isLikelyCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; GoogleOther)"
    ),
    true
  );
  assert.equal(
    isLikelyCrawlerUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    ),
    false
  );
});

test("isLikelyCrawler uses Sentry browser tag", () => {
  assert.equal(isLikelyCrawler({ tags: { browser: "GoogleOther" } }), true);
  assert.equal(isLikelyCrawler({ tags: { browser: "Chrome" } }), false);
});

test("shouldDropChunkLoadSentryEvent drops crawler chunk errors", () => {
  const event = {
    tags: { browser: "GoogleOther" },
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}, { storage: createMemoryStorage() }), true);
});

test("shouldDropChunkLoadSentryEvent drops first recoverable chunk error", () => {
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
  };
  assert.equal(
    shouldDropChunkLoadSentryEvent(event, {}, {
      userAgent: "Mozilla/5.0 Chrome/120",
      storage: createMemoryStorage(),
      now: 1_000,
    }),
    true
  );
});

test("shouldDropChunkLoadSentryEvent keeps chunk error after reload cooldown", () => {
  const storage = createMemoryStorage();
  storage.setItem(CHUNK_RELOAD_TS_KEY, String(1_000));
  const event = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
  };
  assert.equal(
    shouldDropChunkLoadSentryEvent(event, {}, {
      userAgent: "Mozilla/5.0 Chrome/120",
      storage,
      now: 1_000 + CHUNK_RELOAD_COOLDOWN_MS + 1,
    }),
    false
  );
});

test("attemptChunkLoadReload reloads once per cooldown window", () => {
  const storage = createMemoryStorage();
  let reloadCount = 0;

  assert.equal(
    attemptChunkLoadReload({
      storage,
      reload: () => {
        reloadCount += 1;
      },
      now: 5_000,
    }),
    true
  );
  assert.equal(reloadCount, 1);
  assert.equal(storage.getItem(CHUNK_RELOAD_TS_KEY), "5000");

  assert.equal(
    attemptChunkLoadReload({
      storage,
      reload: () => {
        reloadCount += 1;
      },
      now: 5_000 + 1,
    }),
    false
  );
  assert.equal(reloadCount, 1);
});

test("getChunkErrorMessageFromSentryEvent prefers hint exception", () => {
  const event = { exception: { values: [{ value: "from event" }] } };
  assert.equal(
    getChunkErrorMessageFromSentryEvent(event, {
      originalException: new Error("from hint"),
    }),
    "from hint"
  );
});

function createMemoryStorage() {
  /** @type {Record<string, string>} */
  const data = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}
