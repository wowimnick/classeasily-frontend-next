import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isChunkLoadError,
  isChunkLoadErrorMessage,
  isChunkLoadSentryEvent,
  isCrawlerSentryEvent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

describe("chunk-load-error", () => {
  it("detects Turbopack and webpack chunk failure messages", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
      true,
    );
    assert.equal(isChunkLoadErrorMessage("Loading chunk 42 failed"), true);
    assert.equal(isChunkLoadErrorMessage("ChunkLoadError"), true);
    assert.equal(isChunkLoadErrorMessage("Network request failed"), false);
  });

  it("detects chunk errors on Error objects", () => {
    assert.equal(
      isChunkLoadError(new Error("Failed to load chunk /_next/static/chunks/x.js")),
      true,
    );
  });

  it("drops crawler chunk-load events in Sentry", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
          },
        ],
      },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(isChunkLoadSentryEvent(event), true);
    assert.equal(isCrawlerSentryEvent(event), true);
    assert.equal(shouldDropChunkLoadSentryEvent(event), true);
  });

  it("keeps real-user chunk-load events for Sentry", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
      tags: { browser: "Chrome 131.0.0" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event), false);
  });
});
