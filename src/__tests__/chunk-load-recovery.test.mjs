/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_LOAD_ERROR_PATTERN,
  isChunkLoadError,
  isChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("CHUNK_LOAD_ERROR_PATTERN matches Turbopack and webpack messages", () => {
  assert.match(
    "Failed to load chunk /_next/static/chunks/abc.js from module 964893",
    CHUNK_LOAD_ERROR_PATTERN,
  );
  assert.match("Loading chunk 42 failed", CHUNK_LOAD_ERROR_PATTERN);
  assert.match("ChunkLoadError: something", CHUNK_LOAD_ERROR_PATTERN);
  assert.doesNotMatch("Failed to load widget settings.", CHUNK_LOAD_ERROR_PATTERN);
});

test("isChunkLoadError handles Error instances and causes", () => {
  assert.equal(isChunkLoadError("Failed to load chunk foo.js"), true);
  assert.equal(
    isChunkLoadError(new Error("Failed to load chunk foo.js")),
    true,
  );
  assert.equal(
    isChunkLoadError(
      new Error("wrapper", {
        cause: new Error("Failed to load chunk bar.js"),
      }),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Network timeout")), false);
});

test("isChunkLoadSentryEvent inspects exception values", () => {
  assert.equal(
    isChunkLoadSentryEvent({
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Failed to load chunk /_next/static/chunks/x.js from module 1",
          },
        ],
      },
    }),
    true,
  );
  assert.equal(
    isChunkLoadSentryEvent({
      exception: { values: [{ type: "TypeError", value: "x.some is not a function" }] },
    }),
    false,
  );
});
