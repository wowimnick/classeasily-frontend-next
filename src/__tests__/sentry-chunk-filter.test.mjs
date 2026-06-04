import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getExceptionMessage,
  isChunkLoadErrorMessage,
  isLikelyCrawlerFromEvent,
  shouldDropSentryEvent,
} from "../../sentry.shared.config.js";

describe("isChunkLoadErrorMessage", () => {
  it("matches Turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadErrorMessage("TypeError: x is not a function"), false);
  });
});

describe("shouldDropSentryEvent", () => {
  it("drops crawler chunk errors", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/abc.js from module 1",
          },
        ],
      },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(shouldDropSentryEvent(event), true);
  });

  it("keeps real-user chunk errors for monitoring", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/abc.js from module 1",
          },
        ],
      },
      tags: { browser: "Chrome" },
      contexts: { browser: { name: "Chrome" } },
    };
    assert.equal(shouldDropSentryEvent(event), false);
  });

  it("keeps non-chunk errors from crawlers", () => {
    const event = {
      exception: { values: [{ value: "TypeError: et.some is not a function" }] },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(shouldDropSentryEvent(event), false);
  });
});

describe("getExceptionMessage", () => {
  it("reads the primary exception value", () => {
    assert.equal(
      getExceptionMessage({
        exception: { values: [{ value: "boom" }] },
      }),
      "boom",
    );
  });
});

describe("isLikelyCrawlerFromEvent", () => {
  it("detects GoogleOther browser tag", () => {
    assert.equal(
      isLikelyCrawlerFromEvent({ tags: { browser: "GoogleOther" } }),
      true,
    );
  });
});
