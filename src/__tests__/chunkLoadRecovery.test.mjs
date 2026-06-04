import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHUNK_RELOAD_STORAGE_KEY,
  clearChunkReloadAttempt,
  isChunkLoadError,
  isChunkLoadSentryEvent,
  isLikelyCrawlerBrowser,
  shouldDropChunkLoadSentryEvent,
  tryRecoverFromChunkLoadError,
} from "../lib/chunkLoadRecovery.js";

describe("isChunkLoadError", () => {
  it("matches Turbopack chunk failure messages", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/abc.js from module 1",
        ),
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("tryRecoverFromChunkLoadError", () => {
  it("reloads once and sets session guard", () => {
    const storage = new Map();
    let reloadCount = 0;

    const first = tryRecoverFromChunkLoadError({
      storage: {
        getItem: (k) => storage.get(k) ?? null,
        setItem: (k, v) => storage.set(k, v),
        removeItem: (k) => storage.delete(k),
      },
      reload: () => {
        reloadCount += 1;
      },
    });

    assert.equal(first.recovered, true);
    assert.equal(storage.get(CHUNK_RELOAD_STORAGE_KEY), "1");
    assert.equal(reloadCount, 1);

    const second = tryRecoverFromChunkLoadError({
      storage: {
        getItem: (k) => storage.get(k) ?? null,
        setItem: (k, v) => storage.set(k, v),
        removeItem: (k) => storage.delete(k),
      },
      reload: () => {
        reloadCount += 1;
      },
    });

    assert.equal(second.recovered, false);
    assert.equal(reloadCount, 1);
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk errors", () => {
    const event = {
      message: "Failed to load chunk /_next/static/chunks/x.js",
      tags: { "browser.name": "GoogleOther" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, null), true);
  });

  it("drops first chunk error before reload guard is set", () => {
    const event = {
      exception: {
        values: [{ type: "Error", value: "Failed to load chunk abc" }],
      },
      tags: { "browser.name": "Chrome" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, null), true);
  });
});

describe("isChunkLoadSentryEvent", () => {
  it("detects exception values", () => {
    assert.equal(
      isChunkLoadSentryEvent({
        exception: {
          values: [{ type: "Error", value: "Failed to load chunk x" }],
        },
      }),
      true,
    );
  });
});

describe("isLikelyCrawlerBrowser", () => {
  it("flags GoogleOther", () => {
    assert.equal(isLikelyCrawlerBrowser("GoogleOther"), true);
    assert.equal(isLikelyCrawlerBrowser("Chrome"), false);
  });
});

describe("clearChunkReloadAttempt", () => {
  it("removes storage key", () => {
    const storage = new Map([[CHUNK_RELOAD_STORAGE_KEY, "1"]]);
    clearChunkReloadAttempt({
      removeItem: (k) => storage.delete(k),
    });
    assert.equal(storage.has(CHUNK_RELOAD_STORAGE_KEY), false);
  });
});
