import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  isCrawlerUserAgent,
  isCrawlerSentryEvent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

describe("chunk-load-error", () => {
  it("detects turbopack chunk load failures", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        ),
      ),
      true,
    );
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });

  it("detects Google crawler user agents", () => {
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 Chrome/120.0.0.0"), false);
  });

  it("detects crawler from Sentry browser tag", () => {
    assert.equal(
      isCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
      true,
    );
    assert.equal(
      isCrawlerSentryEvent({ tags: { browser: "Chrome 120" } }),
      false,
    );
  });

  it("drops crawler chunk errors in beforeSend", () => {
    const event = { tags: { browser: "GoogleOther" } };
    const hint = {
      originalException: new Error("Failed to load chunk /_next/static/chunks/x.js"),
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, hint), true);
  });

  it("does not drop unrelated errors", () => {
    const hint = { originalException: new Error("TypeError: x is not a function") };
    assert.equal(shouldDropChunkLoadSentryEvent({}, hint), false);
  });
});
