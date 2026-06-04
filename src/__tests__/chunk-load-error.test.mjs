import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  isChunkLoadSentryEvent,
  isLikelyCrawlerFromSentryEvent,
} from "../lib/chunk-load-error.js";

describe("chunk-load-error", () => {
  it("matches Turbopack chunk failure message", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("matches webpack-style messages", () => {
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
    assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  });

  it("rejects unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
    assert.equal(isChunkLoadError(null), false);
  });

  it("detects chunk failures in Sentry events", () => {
    assert.equal(
      isChunkLoadSentryEvent({
        exception: {
          values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
        },
      }),
      true,
    );
  });

  it("flags crawler traffic in Sentry events", () => {
    assert.equal(
      isLikelyCrawlerFromSentryEvent({
        tags: { browser: "GoogleOther" },
        request: { headers: {} },
      }),
      true,
    );
    assert.equal(
      isLikelyCrawlerFromSentryEvent({
        tags: { browser: "Chrome" },
        request: { headers: { "User-Agent": "Mozilla/5.0 Chrome" } },
      }),
      false,
    );
  });
});
