import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHUNK_LOAD_ERROR_PATTERN,
  isBotChunkLoadSentryEvent,
  isChunkLoadError,
} from "../lib/chunk-load-recovery.js";

describe("chunk-load-recovery", () => {
  it("detects Turbopack chunk load failures", () => {
    const message =
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893";
    assert.equal(isChunkLoadError(new Error(message)), true);
    assert.equal(CHUNK_LOAD_ERROR_PATTERN.test(message), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });

  it("drops bot crawler chunk noise in Sentry", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(isBotChunkLoadSentryEvent(event), true);
  });

  it("keeps real-user chunk errors for retry reporting", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
      tags: { browser: "Chrome 120" },
    };
    assert.equal(isBotChunkLoadSentryEvent(event), false);
  });
});
