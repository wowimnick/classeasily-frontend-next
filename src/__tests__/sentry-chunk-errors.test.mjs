import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isCrawlerSentryEvent,
  isCrawlerUserAgent,
  sentryBeforeSendChunkFilter,
} from "../../sentry-chunk-errors.js";

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

  it("matches webpack-style chunk errors", () => {
    assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects Google crawler user agents", () => {
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

describe("sentryBeforeSendChunkFilter", () => {
  it("drops chunk errors from GoogleOther crawlers", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
      tags: { "browser.name": "GoogleOther" },
    };
    const result = sentryBeforeSendChunkFilter(event, {
      originalException: new Error(event.message),
    });
    assert.equal(result, null);
  });

  it("keeps chunk errors for real browsers", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
      tags: { "browser.name": "Chrome" },
    };
    const result = sentryBeforeSendChunkFilter(event, {
      originalException: new Error(event.message),
    });
    assert.equal(result, event);
  });

  it("passes through non-chunk errors", () => {
    const event = { message: "TypeError: x is not a function", tags: {} };
    const result = sentryBeforeSendChunkFilter(event, {
      originalException: new TypeError("x is not a function"),
    });
    assert.equal(result, event);
  });
});

describe("isCrawlerSentryEvent", () => {
  it("uses browser.name tag from Sentry", () => {
    assert.equal(
      isCrawlerSentryEvent({ tags: { "browser.name": "GoogleOther" } }),
      true,
    );
  });
});
