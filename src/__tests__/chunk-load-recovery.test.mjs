import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  shouldIgnoreChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack stale chunk messages", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
        ),
      ),
      true,
    );
  });

  it("detects legacy webpack chunk messages", () => {
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed.")), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("shouldIgnoreChunkLoadSentryEvent", () => {
  it("drops events whose original exception is a chunk load failure", () => {
    assert.equal(
      shouldIgnoreChunkLoadSentryEvent(
        { message: "something else" },
        {
          originalException: new Error("Failed to load chunk /_next/static/chunks/a.js"),
        },
      ),
      true,
    );
  });

  it("keeps unrelated Sentry events", () => {
    assert.equal(
      shouldIgnoreChunkLoadSentryEvent(
        { message: "TypeError: x is not a function" },
        { originalException: new TypeError("x is not a function") },
      ),
      false,
    );
  });
});
