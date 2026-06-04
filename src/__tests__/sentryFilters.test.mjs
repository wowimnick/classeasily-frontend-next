import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isCrawlerTraffic,
  shouldDropSentryEvent,
} from "../lib/sentryFilters.js";

describe("sentryFilters", () => {
  it("detects turbopack chunk load failures", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    };
    assert.equal(isChunkLoadError(event), true);
  });

  it("detects classic webpack chunk failures", () => {
    assert.equal(isChunkLoadError({ message: "Loading chunk 42 failed." }), true);
  });

  it("flags GoogleOther as crawler traffic", () => {
    assert.equal(
      isCrawlerTraffic({ tags: { browser: "GoogleOther", "browser.name": "GoogleOther" } }),
      true,
    );
  });

  it("drops crawler chunk load noise only", () => {
    const crawlerChunk = {
      message: "Failed to load chunk /_next/static/chunks/foo.js",
      tags: { browser: "GoogleOther" },
    };
    const userChunk = {
      message: "Failed to load chunk /_next/static/chunks/foo.js",
      tags: { browser: "Chrome" },
    };
    assert.equal(shouldDropSentryEvent(crawlerChunk), true);
    assert.equal(shouldDropSentryEvent(userChunk), false);
  });

  it("keeps unrelated errors", () => {
    assert.equal(
      shouldDropSentryEvent({ message: "TypeError: x is not a function" }),
      false,
    );
  });
});
