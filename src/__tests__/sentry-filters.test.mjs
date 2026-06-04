import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isCrawlerSentryEvent,
  shouldDropSentryEvent,
} from "../lib/sentry-filters.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadError(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError("Network request failed"), false);
  });
});

describe("isCrawlerSentryEvent", () => {
  it("flags GoogleOther browser tag", () => {
    assert.equal(
      isCrawlerSentryEvent({ tags: { "browser.name": "GoogleOther" } }),
      true,
    );
  });

  it("flags Googlebot user agent in request headers", () => {
    assert.equal(
      isCrawlerSentryEvent({
        request: { headers: { "User-Agent": "Mozilla/5.0 Googlebot/2.1" } },
      }),
      true,
    );
  });
});

describe("shouldDropSentryEvent", () => {
  it("drops crawler chunk load errors", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
      tags: { "browser.name": "GoogleOther" },
    };
    assert.equal(shouldDropSentryEvent(event, {}), true);
  });

  it("keeps real-user chunk load errors", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
      tags: { "browser.name": "Chrome" },
    };
    assert.equal(shouldDropSentryEvent(event, {}), false);
  });
});
