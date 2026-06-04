import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterChunkLoadSentryEvent,
  isChunkLoadError,
  isCrawlerUserAgent,
} from "../lib/chunk-load-error.js";

describe("isChunkLoadError", () => {
  it("matches Turbopack failed chunk messages", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
        ),
      ),
      true,
    );
  });

  it("matches webpack-style chunk messages", () => {
    assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Network Error")), false);
  });
});

describe("isCrawlerUserAgent", () => {
  it("detects Google crawler signatures from the Sentry event", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; GoogleOther)",
      ),
      true,
    );
  });

  it("ignores normal browsers", () => {
    assert.equal(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("filterChunkLoadSentryEvent", () => {
  it("drops chunk errors for crawlers", () => {
    const event = { message: "Failed to load chunk abc.js" };
    const hint = {
      originalException: new Error("Failed to load chunk abc.js"),
    };
    assert.equal(
      filterChunkLoadSentryEvent(event, hint, {
        userAgent:
          "Mozilla/5.0 (compatible; GoogleOther/1.0; +http://www.google.com/bot.html)",
      }),
      null,
    );
  });

  it("drops first chunk error for real browsers until reload was attempted", () => {
    const event = { message: "Failed to load chunk abc.js" };
    const hint = {
      originalException: new Error("Failed to load chunk abc.js"),
    };
    assert.equal(
      filterChunkLoadSentryEvent(event, hint, {
        userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
        reloadAttempted: false,
      }),
      null,
    );
  });

  it("reports chunk error after reload already failed", () => {
    const event = { message: "Failed to load chunk abc.js" };
    const hint = {
      originalException: new Error("Failed to load chunk abc.js"),
    };
    assert.equal(
      filterChunkLoadSentryEvent(event, hint, {
        userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
        reloadAttempted: true,
      }),
      event,
    );
  });

  it("passes through non-chunk errors", () => {
    const event = { message: "TypeError: x is not a function" };
    assert.equal(
      filterChunkLoadSentryEvent(event, {
        originalException: new TypeError("x is not a function"),
      }),
      event,
    );
  });
});
