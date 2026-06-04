import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_LOAD_ERROR_PATTERNS,
  isChunkLoadError,
} from "../lib/chunk-load-error.js";

test("CHUNK_LOAD_ERROR_PATTERNS match Turbopack and webpack messages", () => {
  const samples = [
    "Failed to load chunk /_next/static/chunks/abc.js from module 1",
    "Loading chunk 42 failed.",
    "ChunkLoadError: Loading chunk failed",
  ];
  for (const sample of samples) {
    assert.ok(
      CHUNK_LOAD_ERROR_PATTERNS.some((p) => p.test(sample)),
      `expected a pattern to match: ${sample}`,
    );
  }
});

test("isChunkLoadError returns false for unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError("TypeError: x is not a function"), false);
});

test("isChunkLoadError detects Error objects", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/x.js?dpl=dpl_abc from module 9",
      ),
    ),
    true,
  );
});
