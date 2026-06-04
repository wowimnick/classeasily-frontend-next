import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  isCrawlerBrowserName,
  isCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("matches Turbopack chunk failures", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
        ),
      ),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("crawler detection", () => {
  it("detects GoogleOther browser tag", () => {
    assert.equal(isCrawlerBrowserName("GoogleOther"), true);
    assert.equal(isCrawlerBrowserName("Chrome"), false);
  });

  it("detects googlebot user agents", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
      true,
    );
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
      ),
      false,
    );
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops crawler chunk errors", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/a.js from module 9",
          },
        ],
      },
      tags: { browser: "GoogleOther" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event), true);
  });

  it("keeps real-user chunk errors when no reload was attempted", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/a.js from module 9",
          },
        ],
      },
      tags: { browser: "Chrome" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event), false);
  });
});
