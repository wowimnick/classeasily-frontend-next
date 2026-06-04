import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyAutomatedClient,
  shouldReportChunkLoadErrorToSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack chunk failure message", () => {
  const err = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893"
  );
  assert.equal(isChunkLoadError(err), true);
});

test("isChunkLoadError matches webpack-style messages", () => {
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
});

test("isChunkLoadError rejects unrelated errors", () => {
  assert.equal(isChunkLoadError(new Error("Network Error")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("isLikelyAutomatedClient detects GoogleOther", () => {
  assert.equal(
    isLikelyAutomatedClient(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36"
    ),
    true
  );
  assert.equal(
    isLikelyAutomatedClient(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    ),
    false
  );
});

test("shouldReportChunkLoadErrorToSentry skips crawlers", () => {
  const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(
    shouldReportChunkLoadErrorToSentry(err, "GoogleOther"),
    false
  );
});
