/**
 * Run: node --test src/__tests__/sentry-chunk-errors.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadEvent,
} from "../lib/sentry-chunk-errors.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js from module 123"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("shouldDropChunkLoadEvent drops crawler chunk failures", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
  const event = {
    message: error.message,
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldDropChunkLoadEvent(event, { originalException: error }), true);
});

test("shouldDropChunkLoadEvent keeps real-user chunk failures", () => {
  const error = new Error("Failed to load chunk /_next/static/chunks/x.js");
  const event = {
    message: error.message,
    tags: { browser: "Chrome 120" },
    contexts: { browser: { name: "Chrome" } },
  };
  assert.equal(shouldDropChunkLoadEvent(event, { originalException: error }), false);
});
