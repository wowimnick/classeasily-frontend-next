import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  isCrawlerBrowserName,
  shouldDropChunkLoadSentryEvent,
} from "../lib/sentry-chunk-errors.js";

describe("isChunkLoadError", () => {
  it("matches Next.js turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        ),
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("isCrawlerBrowserName", () => {
  it("flags GoogleOther", () => {
    assert.equal(isCrawlerBrowserName("GoogleOther"), true);
  });

  it("does not flag Chrome", () => {
    assert.equal(isCrawlerBrowserName("Chrome"), false);
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk load noise", () => {
    const event = {
      message: "Failed to load chunk …",
      tags: { browser: "GoogleOther" },
    };
    const hint = {
      originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, hint), true);
  });

  it("keeps real-user chunk load events", () => {
    const event = {
      message: "Failed to load chunk …",
      tags: { browser: "Chrome" },
    };
    const hint = {
      originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, hint), false);
  });
});
