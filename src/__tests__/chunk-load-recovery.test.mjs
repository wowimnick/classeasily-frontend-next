import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isStaleChunkLoadError,
  isCrawlerUserAgent,
} from "../lib/chunk-load-recovery.js";

describe("isStaleChunkLoadError", () => {
  it("matches Turbopack chunk failure messages", () => {
    assert.equal(
      isStaleChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/abc.js from module 123",
        ),
      ),
      true,
    );
  });

  it("matches webpack-style ChunkLoadError", () => {
    const err = new Error("Loading chunk 42 failed");
    err.name = "ChunkLoadError";
    assert.equal(isStaleChunkLoadError(err), true);
  });

  it("rejects unrelated errors", () => {
    assert.equal(isStaleChunkLoadError(new Error("Network Error")), false);
    assert.equal(isStaleChunkLoadError(null), false);
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects GoogleOther and Googlebot", () => {
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; GoogleOther)"), true);
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  });

  it("rejects normal browsers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0",
      ),
      false,
    );
  });
});
