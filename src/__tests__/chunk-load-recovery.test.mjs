import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunkLoadRecovery.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk load failures", () => {
    const err = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    );
    assert.equal(isChunkLoadError(err), true);
  });

  it("detects webpack-style chunk errors", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops events whose exception value is a chunk load error", () => {
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Failed to load chunk /_next/static/chunks/foo.js from module 1",
          },
        ],
      },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  });

  it("keeps unrelated Sentry events", () => {
    const event = {
      exception: {
        values: [{ type: "TypeError", value: "et.some is not a function" }],
      },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), false);
  });
});
