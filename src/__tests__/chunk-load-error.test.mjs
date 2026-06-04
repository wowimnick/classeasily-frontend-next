import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
  shouldSuppressChunkLoadReport,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack failed chunk messages", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("detects webpack-style chunk messages", () => {
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("isLikelyCrawlerUserAgent", () => {
  it("flags GoogleOther from Sentry sample", () => {
    assert.equal(isLikelyCrawlerUserAgent("Mozilla/5.0 GoogleOther"), true);
  });

  it("allows normal browsers", () => {
    assert.equal(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("shouldSuppressChunkLoadReport", () => {
  it("suppresses crawler chunk failures", () => {
    const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
    assert.equal(shouldSuppressChunkLoadReport(err, "GoogleOther"), true);
  });

  it("does not suppress real-user chunk failures before reload", () => {
    const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
    assert.equal(
      shouldSuppressChunkLoadReport(
        err,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ),
      false,
    );
  });
});
