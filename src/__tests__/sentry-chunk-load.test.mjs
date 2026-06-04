import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHUNK_RELOAD_SESSION_KEY,
  chunkLoadBeforeSend,
  isChunkLoadError,
  isChunkLoadErrorMessage,
  isCrawlerFromSentryEvent,
  isCrawlerUserAgent,
} from "../lib/sentry-chunk-load.js";

describe("isChunkLoadErrorMessage", () => {
  it("matches Turbopack stale chunk errors", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123",
      ),
      true,
    );
  });

  it("matches webpack chunk errors", () => {
    assert.equal(
      isChunkLoadErrorMessage("Loading chunk 42 failed."),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
  });
});

describe("isChunkLoadError", () => {
  it("accepts Error objects", () => {
    assert.equal(
      isChunkLoadError(new Error("Failed to load chunk /_next/static/chunks/x.js")),
      true,
    );
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects Google crawlers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
      true,
    );
  });

  it("ignores normal browsers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("isCrawlerFromSentryEvent", () => {
  it("uses Sentry browser tags", () => {
    assert.equal(
      isCrawlerFromSentryEvent({ tags: { browser: "GoogleOther" } }),
      true,
    );
  });
});

describe("chunkLoadBeforeSend", () => {
  it("drops crawler chunk-load noise", () => {
    const result = chunkLoadBeforeSend(
      {
        message: "Failed to load chunk /_next/static/chunks/a.js",
        tags: { browser: "GoogleOther" },
      },
      {
        originalException: new Error(
          "Failed to load chunk /_next/static/chunks/a.js",
        ),
      },
    );
    assert.equal(result, null);
  });

  it("drops first chunk error before reload flag is set", () => {
    const storage = new Map();
    global.sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    };

    const result = chunkLoadBeforeSend(
      { message: "Failed to load chunk /_next/static/chunks/a.js" },
      {
        originalException: new Error(
          "Failed to load chunk /_next/static/chunks/a.js",
        ),
      },
    );
    assert.equal(result, null);

    delete global.sessionStorage;
  });

  it("allows chunk errors after reload was attempted", () => {
    const storage = new Map([[CHUNK_RELOAD_SESSION_KEY, "1"]]);
    global.sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    };

    const event = { message: "Failed to load chunk /_next/static/chunks/a.js" };
    const result = chunkLoadBeforeSend(event, {
      originalException: new Error(
        "Failed to load chunk /_next/static/chunks/a.js",
      ),
    });
    assert.equal(result, event);

    delete global.sessionStorage;
  });

  it("passes through non-chunk errors", () => {
    const event = { message: "Something else broke" };
    assert.equal(
      chunkLoadBeforeSend(event, { originalException: new Error("Other") }),
      event,
    );
  });
});
