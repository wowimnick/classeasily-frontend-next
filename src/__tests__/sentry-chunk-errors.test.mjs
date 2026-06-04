import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getExceptionMessageFromEvent,
  isChunkLoadSentryEvent,
  isKnownCrawlerSentryEvent,
  messageLooksLikeChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/sentry-chunk-errors.js";

describe("sentry-chunk-errors", () => {
  it("detects turbopack chunk load messages", () => {
    assert.equal(
      messageLooksLikeChunkLoadError(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
      true,
    );
    assert.equal(messageLooksLikeChunkLoadError("TypeError: foo"), false);
  });

  it("reads exception text from Sentry events", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
    };
    assert.equal(isChunkLoadSentryEvent(event), true);
    assert.match(getExceptionMessageFromEvent(event), /Failed to load chunk/);
  });

  it("drops crawler chunk errors", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(isKnownCrawlerSentryEvent(event), true);
    assert.equal(shouldDropChunkLoadSentryEvent(event), true);
  });
});
