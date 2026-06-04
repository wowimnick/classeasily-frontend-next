import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isChunkLoadError,
  shouldDropSentryEvent,
} from "../../sentry.shared.config.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failures", () => {
    const error = new Error(
      "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_test from module 1",
    );
    assert.equal(isChunkLoadError(error), true);
  });

  it("detects webpack-style chunk failures", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("shouldDropSentryEvent", () => {
  it("drops chunk load errors", () => {
    const event = {
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/x.js" }],
      },
    };
    assert.equal(shouldDropSentryEvent(event, {}), true);
  });

  it("drops crawler traffic tagged as GoogleOther", () => {
    const event = {
      message: "Some other error",
      tags: { browser: "GoogleOther", "browser.name": "GoogleOther" },
    };
    assert.equal(shouldDropSentryEvent(event, {}), true);
  });

  it("keeps real user errors", () => {
    const event = {
      message: "TypeError: x is not a function",
      tags: { browser: "Chrome 137", "browser.name": "Chrome" },
    };
    assert.equal(
      shouldDropSentryEvent(event, { originalException: new TypeError("x") }),
      false,
    );
  });
});
