/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_LOAD_RELOAD_KEY,
  clearChunkLoadReloadFlag,
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldReportChunkLoadErrorToSentry,
  tryRecoverFromChunkLoadError,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isCrawlerUserAgent detects GoogleOther", () => {
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 GoogleOther"), true);
  assert.equal(isCrawlerUserAgent("Mozilla/5.0 Chrome/120.0"), false);
});

test("tryRecoverFromChunkLoadError suppresses crawlers without reload", () => {
  const reloads = [];
  const storage = {
    _data: {},
    getItem(k) {
      return this._data[k] ?? null;
    },
    setItem(k, v) {
      this._data[k] = v;
    },
    removeItem(k) {
      delete this._data[k];
    },
  };

  const handled = tryRecoverFromChunkLoadError(
    new Error("Failed to load chunk /_next/static/chunks/a.js"),
    {
      userAgent: "GoogleOther",
      storage,
      location: { reload: () => reloads.push(1) },
    },
  );

  assert.equal(handled, true);
  assert.equal(reloads.length, 0);
  assert.equal(storage.getItem(CHUNK_LOAD_RELOAD_KEY), null);
});

test("tryRecoverFromChunkLoadError reloads once for real users", () => {
  const reloads = [];
  const storage = {
    _data: {},
    getItem(k) {
      return this._data[k] ?? null;
    },
    setItem(k, v) {
      this._data[k] = v;
    },
    removeItem(k) {
      delete this._data[k];
    },
  };

  const err = new Error("Failed to load chunk /_next/static/chunks/a.js");

  assert.equal(
    tryRecoverFromChunkLoadError(err, {
      userAgent: "Mozilla/5.0 Chrome",
      storage,
      location: { reload: () => reloads.push(1) },
    }),
    true,
  );
  assert.deepEqual(reloads, [1]);
  assert.equal(storage.getItem(CHUNK_LOAD_RELOAD_KEY), "1");

  assert.equal(
    tryRecoverFromChunkLoadError(err, {
      userAgent: "Mozilla/5.0 Chrome",
      storage,
      location: { reload: () => reloads.push(2) },
    }),
    false,
  );
  assert.equal(storage.getItem(CHUNK_LOAD_RELOAD_KEY), null);
});

test("shouldReportChunkLoadErrorToSentry drops crawlers and first-hit users", () => {
  const storage = {
    _data: {},
    getItem(k) {
      return this._data[k] ?? null;
    },
    setItem(k, v) {
      this._data[k] = v;
    },
    removeItem(k) {
      delete this._data[k];
    },
  };

  const err = new Error("Failed to load chunk /_next/static/chunks/a.js");

  assert.equal(
    shouldReportChunkLoadErrorToSentry(err, {
      userAgent: "GoogleOther",
      storage,
    }),
    false,
  );

  assert.equal(
    shouldReportChunkLoadErrorToSentry(err, {
      userAgent: "Mozilla/5.0 Chrome",
      storage,
    }),
    false,
  );

  storage.setItem(CHUNK_LOAD_RELOAD_KEY, "1");
  assert.equal(
    shouldReportChunkLoadErrorToSentry(err, {
      userAgent: "Mozilla/5.0 Chrome",
      storage,
    }),
    true,
  );

  clearChunkLoadReloadFlag(storage);
  assert.equal(storage.getItem(CHUNK_LOAD_RELOAD_KEY), null);
});
