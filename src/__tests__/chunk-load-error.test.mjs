import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isChunkLoadError } from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failure messages", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        ),
      ),
      true,
    );
  });

  it("detects webpack-style chunk messages", () => {
    assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
    assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});
