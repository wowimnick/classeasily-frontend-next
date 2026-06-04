import assert from "node:assert/strict";
import test from "node:test";

import {
  isBotBrowser,
  isChunkLoadError,
  shouldSuppressChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError matches turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    ),
    true,
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError: loading")), true);
  assert.equal(isChunkLoadError("TypeError: x is not a function"), false);
});

test("isBotBrowser detects crawler user agents", () => {
  assert.equal(isBotBrowser("GoogleOther"), true);
  assert.equal(isBotBrowser("Chrome"), false);
});

test("shouldSuppressChunkLoadSentryEvent drops chunk errors", () => {
  const botEvent = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
    },
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldSuppressChunkLoadSentryEvent(botEvent), true);

  const userEvent = {
    exception: {
      values: [{ value: "Failed to load chunk /_next/static/chunks/b.js" }],
    },
    tags: { browser: "Chrome" },
  };
  assert.equal(shouldSuppressChunkLoadSentryEvent(userEvent), true);

  const otherEvent = {
    exception: { values: [{ value: "TypeError: Cannot read property" }] },
  };
  assert.equal(shouldSuppressChunkLoadSentryEvent(otherEvent), false);
});
