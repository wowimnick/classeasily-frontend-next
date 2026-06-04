import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isChunkLoadError,
  isLikelyCrawlerUserAgent,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

describe("isChunkLoadError", () => {
  it("matches Turbopack chunk failures", () => {
    const error = new Error(
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js?dpl=dpl_x from module 964893",
    );
    assert.equal(isChunkLoadError(error), true);
  });

  it("matches webpack-style chunk errors", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network request failed")), false);
  });
});

describe("isLikelyCrawlerUserAgent", () => {
  it("detects Google crawlers", () => {
    assert.equal(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
      true,
    );
  });

  it("ignores normal browsers", () => {
    assert.equal(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("shouldDropChunkLoadSentryEvent", () => {
  it("drops GoogleOther browser chunk errors", () => {
    const event = {
      message:
        "Failed to load chunk /_next/static/chunks/foo.js from module 1",
      tags: { "browser.name": "GoogleOther" },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), true);
  });

  it("keeps chunk errors from real browsers without recovery marker", () => {
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
      contexts: {
        browser: { name: "Chrome", browser: "Chrome 120" },
      },
    };
    assert.equal(shouldDropChunkLoadSentryEvent(event, {}), false);
  });
});
