import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

test("isChunkLoadError detects Turbopack chunk failures", () => {
  const message =
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893";
  assert.equal(isChunkLoadError(message), true);
  assert.equal(isChunkLoadError(new Error(message)), true);
  assert.equal(isChunkLoadError(new Error("Something else")), false);
});

test("shouldDropChunkLoadSentryEvent drops matching Sentry events", () => {
  const event = {
    exception: {
      values: [
        {
          type: "Error",
          value:
            "Failed to load chunk /_next/static/chunks/foo.js from module 1",
        },
      ],
    },
  };
  assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  assert.equal(
    shouldDropChunkLoadSentryEvent({ message: "Unrelated failure" }, {}),
    false,
  );
});
