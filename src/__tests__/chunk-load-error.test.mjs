import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  isLikelyCrawlerFromSentryEvent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failure messages", () => {
    const error = new Error(
      "Failed to load chunk /_next/static/chunks/abc.js from module 1",
    );
    assert.equal(isChunkLoadError(error), true);
  });

  it("detects webpack-style chunk messages", () => {
    assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("isLikelyCrawlerFromSentryEvent", () => {
  it("flags GoogleOther browser tag", () => {
    assert.equal(
      isLikelyCrawlerFromSentryEvent({ tags: { browser: "GoogleOther" } }),
      true,
    );
  });

  it("flags googlebot user agents", () => {
    assert.equal(
      isLikelyCrawlerFromSentryEvent({
        request: { headers: { "User-Agent": "Mozilla/5.0 Googlebot/2.1" } },
      }),
      true,
    );
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk errors", () => {
    const event = { tags: { browser: "GoogleOther" }, message: "Failed to load chunk x" };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  });

  it("drops first chunk error in browser when reload not attempted", () => {
    const storage = new Map();
    global.sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };
    global.window = {};

    const event = { message: "Failed to load chunk x" };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);

    storage.set(CHUNK_RELOAD_SESSION_KEY, "1");
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), false);

    delete global.sessionStorage;
    delete global.window;
  });
});
