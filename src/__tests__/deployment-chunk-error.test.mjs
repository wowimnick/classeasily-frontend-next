import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  isDeploymentChunkLoadError,
  shouldDropDeploymentChunkSentryEvent,
} from "../lib/deployment-chunk-error.js";

test("detects turbopack deployment chunk failures", () => {
  const error = new Error(
    "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_test from module 964893"
  );
  assert.equal(isDeploymentChunkLoadError(error), true);
});

test("detects webpack-style chunk load failures", () => {
  assert.equal(
    isDeploymentChunkLoadError(new Error("Loading chunk 42 failed.")),
    true
  );
  assert.equal(isDeploymentChunkLoadError(new Error("ChunkLoadError")), true);
});

test("ignores unrelated application errors", () => {
  assert.equal(
    isDeploymentChunkLoadError(new Error("Failed to load widget settings.")),
    false
  );
  assert.equal(isDeploymentChunkLoadError(null), false);
});

test("getErrorMessage supports string and Error values", () => {
  assert.equal(getErrorMessage("Loading chunk 1 failed."), "Loading chunk 1 failed.");
  assert.equal(getErrorMessage(new Error("boom")), "boom");
});

test("shouldDropDeploymentChunkSentryEvent matches Sentry exception payloads", () => {
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
  assert.equal(shouldDropDeploymentChunkSentryEvent(event), true);
  assert.equal(
    shouldDropDeploymentChunkSentryEvent({
      exception: { values: [{ type: "TypeError", value: "x.some is not a function" }] },
    }),
    false
  );
});
