import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
} from "../lib/chunk-load-recovery.js";
import {
  beforeSendClientEvent,
  isCrawlerSentryEvent,
} from "../lib/sentry-client-filters.js";

describe("isChunkLoadError", () => {
  it("matches Next.js turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadError(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
      true,
    );
  });

  it("matches legacy webpack chunk messages", () => {
    assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
    assert.equal(isChunkLoadError("ChunkLoadError: something"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError("TypeError: x is not a function"), false);
    assert.equal(isChunkLoadError(""), false);
  });
});

describe("isCrawlerSentryEvent", () => {
  it("detects GoogleOther browser tag from Sentry", () => {
    assert.equal(
      isCrawlerSentryEvent({ tags: { browser: "GoogleOther" } }),
      true,
    );
  });

  it("detects googlebot in user agent", () => {
    assert.equal(
      isCrawlerSentryEvent({
        request: { headers: { "User-Agent": "Mozilla/5.0 Googlebot/2.1" } },
      }),
      true,
    );
  });

  it("does not flag normal browsers", () => {
    assert.equal(
      isCrawlerSentryEvent({
        tags: { browser: "Chrome 120" },
        request: { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } },
      }),
      false,
    );
  });
});

describe("beforeSendClientEvent", () => {
  const chunkMessage =
    "Failed to load chunk /_next/static/chunks/abc.js from module 1";

  it("drops crawler chunk load errors", () => {
    assert.equal(
      beforeSendClientEvent({
        tags: { browser: "GoogleOther" },
        exception: { values: [{ value: chunkMessage }] },
      }),
      null,
    );
  });
});
