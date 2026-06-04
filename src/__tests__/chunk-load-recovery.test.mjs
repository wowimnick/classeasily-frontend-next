import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

describe("chunk-load-recovery", () => {
  it("detects Turbopack stale chunk errors", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("detects classic webpack chunk errors", () => {
    assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
    assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
    assert.equal(isChunkLoadError(null), false);
  });

  it("filters matching Sentry events", () => {
    assert.equal(
      shouldDropChunkLoadSentryEvent({
        exception: {
          values: [
            {
              value:
                "Failed to load chunk /_next/static/chunks/foo.js from module 1",
            },
          ],
        },
      }),
      true,
    );
    assert.equal(
      shouldDropChunkLoadSentryEvent({
        message: "TypeError: Cannot read properties of undefined",
      }),
      false,
    );
  });
});
