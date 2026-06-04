import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  clearChunkReloadAttemptFlag,
  createChunkLoadAwareBeforeSend,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack stale chunk messages", () => {
    const error = new Error(
      "Failed to load chunk /_next/static/chunks/abc.js from module 123",
    );
    assert.equal(isChunkLoadError(error), true);
  });

  it("detects webpack ChunkLoadError names and messages", () => {
    const error = new Error("Loading chunk 42 failed.");
    error.name = "ChunkLoadError";
    assert.equal(isChunkLoadError(error), true);
  });

  it("returns false for unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("tryRecoverFromChunkLoadError", () => {
  it("reloads once and sets the session guard", () => {
    const storage = new Map();
    globalThis.sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };

    let reloadCount = 0;
    globalThis.window = {
      location: {
        reload: () => {
          reloadCount += 1;
        },
      },
    };

    const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
    assert.equal(tryRecoverFromChunkLoadError(error), true);
    assert.equal(reloadCount, 1);
    assert.equal(storage.get(CHUNK_RELOAD_SESSION_KEY), "1");
    assert.equal(tryRecoverFromChunkLoadError(error), false);
    assert.equal(reloadCount, 1);

    clearChunkReloadAttemptFlag();
    delete globalThis.window;
    delete globalThis.sessionStorage;
  });
});

describe("createChunkLoadAwareBeforeSend", () => {
  it("drops first chunk load error and triggers recovery", () => {
    const storage = new Map();
    globalThis.sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };

    let reloadCount = 0;
    globalThis.window = {
      location: {
        reload: () => {
          reloadCount += 1;
        },
      },
    };

    const beforeSend = createChunkLoadAwareBeforeSend();
    const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
    const event = { message: error.message };

    assert.equal(beforeSend(event, { originalException: error }), null);
    assert.equal(reloadCount, 1);

    assert.equal(
      beforeSend(event, { originalException: error }),
      event,
    );

    delete globalThis.window;
    delete globalThis.sessionStorage;
  });
});
