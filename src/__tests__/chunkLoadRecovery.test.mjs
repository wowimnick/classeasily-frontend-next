import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getChunkReloadSessionKey,
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
  reloadOnceForChunkError,
} from "../lib/chunkLoadRecovery.js";

describe("isChunkLoadError", () => {
  it("detects turbopack chunk load failures", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/example.js from module 964893",
        ),
      ),
      true,
    );
  });

  it("detects webpack-style chunk failures", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("isLikelyCrawlerUserAgent", () => {
  it("flags GoogleOther and common crawlers", () => {
    assert.equal(isLikelyCrawlerUserAgent("GoogleOther"), true);
    assert.equal(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
      true,
    );
  });

  it("ignores regular browsers", () => {
    assert.equal(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("reloadOnceForChunkError", () => {
  it("reloads only once per session", () => {
    const storage = new Map();
    const reloadCalls = [];

    const first = reloadOnceForChunkError({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
      reload: () => reloadCalls.push(Date.now()),
    });

    const second = reloadOnceForChunkError({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
      reload: () => reloadCalls.push(Date.now()),
    });

    assert.equal(first, true);
    assert.equal(second, false);
    assert.equal(reloadCalls.length, 1);
    assert.ok(storage.has(getChunkReloadSessionKey()));
  });
});
