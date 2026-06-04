import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("shouldDropChunkLoadSentryEvent uses hint and event payloads", () => {
  const chunkErr = new Error("Failed to load chunk /_next/static/chunks/a.js");
  assert.equal(
    shouldDropChunkLoadSentryEvent({}, { originalException: chunkErr }),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { exception: { values: [{ value: chunkErr.message }] } },
      {}
    ),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: chunkErr.message }, {}),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent(
      { message: "TypeError: x is not a function" },
      { originalException: new Error("TypeError: x is not a function") }
    ),
    false
  );
});
