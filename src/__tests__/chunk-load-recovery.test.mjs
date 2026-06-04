import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getExceptionMessage,
  isChunkLoadErrorMessage,
  isCrawlerBrowserName,
  isLikelyCrawlerUserAgent,
  shouldIgnoreChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

describe("isChunkLoadErrorMessage", () => {
  it("matches Turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123",
      ),
      true,
    );
  });

  it("matches webpack-style chunk failures", () => {
    assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
  });
});

describe("shouldIgnoreChunkLoadSentryEvent", () => {
  it("drops GoogleOther crawler chunk errors", () => {
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "Failed to load chunk /_next/static/chunks/x.js from module 1",
          },
        ],
      },
      tags: { "browser.name": "GoogleOther" },
    };
    assert.equal(shouldIgnoreChunkLoadSentryEvent(event), true);
  });

  it("drops events with crawler user agents", () => {
    const event = {
      message: "Failed to load chunk abc.js",
      request: { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } },
    };
    assert.equal(shouldIgnoreChunkLoadSentryEvent(event), true);
  });

  it("keeps non-chunk errors", () => {
    const event = {
      exception: { values: [{ type: "TypeError", value: "Cannot read x" }] },
      tags: { "browser.name": "Chrome" },
    };
    assert.equal(shouldIgnoreChunkLoadSentryEvent(event), false);
  });
});

describe("helpers", () => {
  it("extracts exception messages", () => {
    assert.equal(
      getExceptionMessage({
        exception: { values: [{ type: "Error", value: "boom" }] },
      }),
      "boom",
    );
  });

  it("detects crawler browsers and user agents", () => {
    assert.equal(isCrawlerBrowserName("GoogleOther"), true);
    assert.equal(isCrawlerBrowserName("Chrome"), false);
    assert.equal(isLikelyCrawlerUserAgent("Googlebot/2.1"), true);
    assert.equal(isLikelyCrawlerUserAgent("Chrome/120"), false);
  });
});
