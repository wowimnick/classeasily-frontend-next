import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isCrawlerBrowserName,
  shouldDropSentryEvent,
} from "../../sentry.shared.config.js";

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
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("isCrawlerBrowserName", () => {
  it("detects GoogleOther and generic bot names", () => {
    assert.equal(isCrawlerBrowserName("GoogleOther"), true);
    assert.equal(isCrawlerBrowserName("Googlebot"), true);
    assert.equal(isCrawlerBrowserName("SomethingBot"), true);
  });

  it("does not flag normal browsers", () => {
    assert.equal(isCrawlerBrowserName("Chrome"), false);
    assert.equal(isCrawlerBrowserName("Mobile Safari"), false);
  });
});

describe("shouldDropSentryEvent", () => {
  it("drops crawler chunk-load errors", () => {
    const event = { tags: { "browser.name": "GoogleOther" } };
    const hint = {
      originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
    };
    assert.equal(shouldDropSentryEvent(event, hint), true);
  });

  it("keeps chunk-load errors from real browsers", () => {
    const event = { tags: { "browser.name": "Chrome" } };
    const hint = {
      originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
    };
    assert.equal(shouldDropSentryEvent(event, hint), false);
  });

  it("keeps non-chunk errors from crawlers", () => {
    const event = { tags: { "browser.name": "GoogleOther" } };
    const hint = { originalException: new Error("TypeError: x is not a function") };
    assert.equal(shouldDropSentryEvent(event, hint), false);
  });
});
