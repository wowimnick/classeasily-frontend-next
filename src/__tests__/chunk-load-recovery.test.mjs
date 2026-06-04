import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isChunkLoadError,
  shouldSuppressChunkLoadErrorForSentry,
} from "../lib/chunk-load-recovery.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        ),
      ),
      true,
    );
  });

  it("detects webpack-style chunk failures", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("shouldSuppressChunkLoadErrorForSentry", () => {
  const chunkEvent = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/example.js from module 1",
        },
      ],
    },
  };

  it("suppresses crawler chunk errors", () => {
    assert.equal(
      shouldSuppressChunkLoadErrorForSentry({
        ...chunkEvent,
        tags: { browser: "GoogleOther" },
      }),
      true,
    );
  });

  it("suppresses first chunk failure before reload is attempted", () => {
    assert.equal(shouldSuppressChunkLoadErrorForSentry(chunkEvent), true);
  });

  it("does not suppress unrelated errors", () => {
    assert.equal(
      shouldSuppressChunkLoadErrorForSentry({
        exception: { values: [{ value: "TypeError: x is not a function" }] },
      }),
      false,
    );
  });
});
