import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.mjs";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failures", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("detects webpack-style messages", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects GoogleOther / Googlebot", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; GoogleOther)",
      ),
      true,
    );
  });

  it("ignores normal browsers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk errors via browser tag", () => {
    const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
    const event = { tags: { "browser.name": "GoogleOther" } };
    assert.equal(shouldDropChunkLoadSentryEvent(event, { originalException: err }), true);
  });

  it("keeps real-user chunk errors for optional follow-up", () => {
    const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
    const event = {
      tags: { "browser.name": "Chrome" },
      request: { headers: { "User-Agent": "Chrome/120" } },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, { originalException: err }), false);
  });
});
