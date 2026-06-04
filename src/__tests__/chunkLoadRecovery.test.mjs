import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  getChunkReloadTimestamp,
  isChunkLoadError,
  isKnownCrawlerUserAgent,
  shouldDropSentryEvent,
  shouldReloadForChunkError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunkLoadRecovery.js";

describe("isChunkLoadError", () => {
  test("matches Next.js turbopack chunk message", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893"
        )
      ),
      true
    );
  });

  test("rejects unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("shouldReloadForChunkError", () => {
  test("allows first reload", () => {
    assert.equal(shouldReloadForChunkError(20_000, null), true);
  });

  test("blocks reload inside cooldown", () => {
    assert.equal(
      shouldReloadForChunkError(20_000, String(20_000 - CHUNK_RELOAD_COOLDOWN_MS + 1)),
      false
    );
  });

  test("allows reload after cooldown", () => {
    assert.equal(
      shouldReloadForChunkError(30_000, String(30_000 - CHUNK_RELOAD_COOLDOWN_MS - 1)),
      true
    );
  });
});

describe("tryRecoverFromChunkLoadError", () => {
  test("reloads once and records timestamp", () => {
    const data = {};
    const storage = {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        data[k] = v;
      },
    };
    const reloads = [];
    const ok = tryRecoverFromChunkLoadError({
      error: new Error("Failed to load chunk foo.js"),
      reload: () => reloads.push(1),
      storage,
      now: 1_000,
    });
    assert.equal(ok, true);
    assert.deepEqual(reloads, [1]);
    assert.equal(getChunkReloadTimestamp(storage), "1000");
  });

  test("does not reload twice within cooldown", () => {
    const storage = new Map([["ce-chunk-reload-ts", "5000"]]);
    const reloads = [];
    const ok = tryRecoverFromChunkLoadError({
      error: new Error("ChunkLoadError"),
      reload: () => reloads.push(1),
      storage: {
        getItem: (k) => storage.get(k) ?? null,
        setItem: (k, v) => storage.set(k, v),
      },
      now: 5_000 + CHUNK_RELOAD_COOLDOWN_MS - 1,
    });
    assert.equal(ok, false);
    assert.deepEqual(reloads, []);
  });
});

describe("shouldDropSentryEvent", () => {
  test("drops crawler chunk errors", () => {
    const drop = shouldDropSentryEvent(
      { request: { headers: { "User-Agent": "GoogleOther" } } },
      {
        originalException: new Error("Failed to load chunk x.js"),
      }
    );
    assert.equal(drop, true);
  });

  test("drops chunk errors eligible for auto-reload", () => {
    const drop = shouldDropSentryEvent(
      {},
      { originalException: new Error("Failed to load chunk x.js") },
      { storage: null, now: 10_000 }
    );
    assert.equal(drop, true);
  });

  test("reports chunk errors when reload was attempted recently and failed", () => {
    const data = { "ce-chunk-reload-ts": "9000" };
    const storage = {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        data[k] = v;
      },
    };
    const drop = shouldDropSentryEvent(
      {},
      { originalException: new Error("Failed to load chunk x.js") },
      { storage, now: 9_000 + CHUNK_RELOAD_COOLDOWN_MS - 1 }
    );
    assert.equal(drop, false);
  });

  test("keeps non-chunk errors for real browsers", () => {
    const drop = shouldDropSentryEvent(
      { request: { headers: { "User-Agent": "Mozilla/5.0 Chrome" } } },
      { originalException: new Error("TypeError: x") }
    );
    assert.equal(drop, false);
  });
});

describe("isKnownCrawlerUserAgent", () => {
  test("flags GoogleOther from Sentry sample", () => {
    assert.equal(isKnownCrawlerUserAgent("GoogleOther"), true);
  });
});
