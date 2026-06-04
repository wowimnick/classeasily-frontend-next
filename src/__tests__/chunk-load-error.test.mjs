/**
 * Run: node --test src/__tests__/chunk-load-error.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isLikelyAutomatedClient,
  shouldReportChunkLoadErrorToSentry,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "x" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("isLikelyAutomatedClient detects crawlers", () => {
  assert.equal(
    isLikelyAutomatedClient(
      "Mozilla/5.0 (compatible; GoogleOther) AppleWebKit/537.36"
    ),
    true
  );
  assert.equal(
    isLikelyAutomatedClient(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0"
    ),
    false
  );
});

test("shouldReportChunkLoadErrorToSentry skips bots", () => {
  const err = new Error("Failed to load chunk /_next/static/chunks/x.js");
  assert.equal(
    shouldReportChunkLoadErrorToSentry(err, "GoogleOther/1.0"),
    false
  );
});
