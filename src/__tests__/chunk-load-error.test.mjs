import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  handleChunkLoadError,
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

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
      isChunkLoadError(new Error("Loading chunk 123 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("handleChunkLoadError", () => {
  it("returns false for non-chunk errors", () => {
    assert.equal(handleChunkLoadError(new Error("boom")), false);
  });
});
