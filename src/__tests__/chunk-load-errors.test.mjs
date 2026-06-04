import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadErrorMessage,
  isChunkLoadSentryEvent,
} from "../lib/chunkLoadErrors.js";

describe("isChunkLoadErrorMessage", () => {
  it("matches Turbopack chunk load failures", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
      true,
    );
  });

  it("matches webpack-style chunk errors", () => {
    assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
    assert.equal(isChunkLoadErrorMessage("ChunkLoadError"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
    assert.equal(isChunkLoadErrorMessage(""), false);
    assert.equal(isChunkLoadErrorMessage(null), false);
  });
});

describe("isChunkLoadSentryEvent", () => {
  it("detects chunk errors in Sentry exception payloads", () => {
    assert.equal(
      isChunkLoadSentryEvent({
        exception: {
          values: [{ value: "Failed to load chunk /_next/static/chunks/foo.js" }],
        },
      }),
      true,
    );
  });

  it("returns false for other exception types", () => {
    assert.equal(
      isChunkLoadSentryEvent({
        exception: { values: [{ value: "Network request failed" }] },
      }),
      false,
    );
  });
});
