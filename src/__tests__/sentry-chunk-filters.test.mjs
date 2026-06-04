import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChunkLoadErrorMessage,
  isCrawlerBrowserName,
  isCrawlerUserAgent,
  shouldDropSentryEvent,
} from "../../sentry.shared.config.js";

describe("sentry chunk load filters", () => {
  it("detects turbopack chunk load errors", () => {
    assert.equal(
      isChunkLoadErrorMessage(
        "Failed to load chunk /_next/static/chunks/abc.js from module 1",
      ),
      true,
    );
    assert.equal(isChunkLoadErrorMessage("Network request failed"), false);
  });

  it("detects crawler user agents", () => {
    assert.equal(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; GoogleOther)",
      ),
      true,
    );
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });

  it("drops chunk errors from crawler browsers in Sentry events", () => {
    const event = {
      exception: {
        values: [
          {
            value:
              "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
          },
        ],
      },
      tags: [["browser.name", "GoogleOther"]],
    };
    assert.equal(shouldDropSentryEvent(event, {}), true);
  });

  it("keeps chunk errors for normal browsers", () => {
    const event = {
      exception: {
        values: [
          {
            value: "Failed to load chunk /_next/static/chunks/abc.js from module 1",
          },
        ],
      },
      tags: [["browser.name", "Chrome"]],
    };
    assert.equal(shouldDropSentryEvent(event, {}), false);
    assert.equal(isCrawlerBrowserName("Chrome"), false);
  });
});
