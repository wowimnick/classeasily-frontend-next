import assert from "node:assert/strict";
import test from "node:test";

import {
  attemptChunkLoadRecovery,
  hasRecentlyAttemptedChunkReload,
  isChunkLoadError,
  isLikelyBotFromSentryEvent,
  isLikelyBotUserAgent,
  markChunkReloadAttempted,
  resetChunkReloadAttemptedForTests,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyBotUserAgent detects common crawlers", () => {
  assert.equal(
    isLikelyBotUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
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

test("isLikelyBotFromSentryEvent uses Sentry browser tags", () => {
  assert.equal(
    isLikelyBotFromSentryEvent({
      tags: { browser: "GoogleOther" },
    }),
    true,
  );
  assert.equal(
    isLikelyBotFromSentryEvent({
      tags: { browser: "Chrome" },
    }),
    false,
  );
});

test("shouldDropChunkLoadSentryEvent drops bot and first-occurrence chunk errors", () => {
  const chunkMessage =
    "Failed to load chunk /_next/static/chunks/abc.js from module 1";

  resetChunkReloadAttemptedForTests();

  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: { values: [{ value: chunkMessage }] },
      tags: { browser: "GoogleOther" },
    }),
    true,
  );

  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: { values: [{ value: chunkMessage }] },
      tags: { browser: "Chrome" },
    }),
    true,
  );

  markChunkReloadAttempted();
  assert.equal(hasRecentlyAttemptedChunkReload(), true);
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: { values: [{ value: chunkMessage }] },
      tags: { browser: "Chrome" },
    }),
    false,
  );

  resetChunkReloadAttemptedForTests();
});

test("attemptChunkLoadRecovery skips bots and only reloads once", () => {
  const reloadCalls = [];
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  resetChunkReloadAttemptedForTests();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { reload: () => reloadCalls.push("reload") } },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent: "Googlebot/2.1" },
  });

  try {
    const chunkError = new Error("Failed to load chunk /_next/static/chunks/a.js");

    assert.equal(attemptChunkLoadRecovery(chunkError), false);
    assert.equal(reloadCalls.length, 0);

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    assert.equal(attemptChunkLoadRecovery(chunkError), true);
    assert.equal(reloadCalls.length, 1);
    assert.equal(hasRecentlyAttemptedChunkReload(), true);

    assert.equal(attemptChunkLoadRecovery(chunkError), false);
    assert.equal(reloadCalls.length, 1);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    resetChunkReloadAttemptedForTests();
  }
});
