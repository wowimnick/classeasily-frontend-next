import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBotUserAgent,
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("matches Turbopack stale-chunk errors", () => {
    const error = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_abc from module 964893",
    );
    assert.equal(isChunkLoadError(error), true);
  });

  it("matches webpack ChunkLoadError by name", () => {
    const error = new Error("Loading chunk 42 failed.");
    error.name = "ChunkLoadError";
    assert.equal(isChunkLoadError(error), true);
  });

  it("matches webpack loading-chunk message", () => {
    assert.equal(isChunkLoadError("Loading chunk 7 failed."), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("isBotUserAgent", () => {
  it("detects GoogleOther and common crawlers", () => {
    assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
    assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  });

  it("ignores normal browsers", () => {
    assert.equal(
      isBotUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});
