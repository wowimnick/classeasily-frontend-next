import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "./chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("matches Next.js turbopack chunk failures", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("matches webpack-style chunk errors", () => {
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects GoogleOther / Googlebot", () => {
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  });

  it("does not flag normal browsers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk errors", () => {
    const event = {
      message: "Failed to load chunk /_next/static/chunks/foo.js",
      contexts: { browser: { name: "GoogleOther" } },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  });

  it("drops real-user chunk errors (handled via reload, not Sentry)", () => {
    const event = {
      message: "Failed to load chunk /_next/static/chunks/foo.js",
      contexts: { browser: { name: "Chrome" } },
      request: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  });

  it("keeps unrelated errors", () => {
    assert.equal(
      shouldDropChunkLoadSentryEvent({ message: "TypeError: x is not a function" }, {}),
      false,
    );
  });
});
