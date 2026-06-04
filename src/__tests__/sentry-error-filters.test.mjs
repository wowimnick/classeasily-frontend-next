import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isStaleChunkLoadError,
  isKnownCrawlerUserAgent,
  shouldCaptureException,
} from "../lib/sentry-error-filters.js";

describe("isStaleChunkLoadError", () => {
  it("matches Turbopack chunk failures", () => {
    assert.equal(
      isStaleChunkLoadError(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isStaleChunkLoadError("Network request failed"), false);
    assert.equal(isStaleChunkLoadError(""), false);
    assert.equal(isStaleChunkLoadError(null), false);
  });
});

describe("isKnownCrawlerUserAgent", () => {
  it("detects Google crawlers", () => {
    assert.equal(isKnownCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
    assert.equal(isKnownCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  });

  it("does not flag normal browsers", () => {
    assert.equal(
      isKnownCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("shouldCaptureException", () => {
  it("skips stale chunk errors", () => {
    assert.equal(
      shouldCaptureException(
        new Error("Failed to load chunk /_next/static/chunks/foo.js"),
      ),
      false,
    );
  });
});
