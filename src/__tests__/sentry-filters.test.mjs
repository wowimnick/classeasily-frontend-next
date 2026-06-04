import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  isCrawlerEvent,
  shouldDropSentryEvent,
  sentryBeforeSend,
} from "../lib/sentry-filters.js";

test("isChunkLoadError matches turbopack chunk failures", () => {
  assert.equal(
    isChunkLoadError(
      "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1",
    ),
    true,
  );
  assert.equal(isChunkLoadError("TypeError: x is not a function"), false);
});

test("isCrawlerEvent detects GoogleOther browser tag", () => {
  assert.equal(
    isCrawlerEvent({ tags: { browser: "GoogleOther" } }),
    true,
  );
  assert.equal(
    isCrawlerEvent({ contexts: { browser: { name: "Chrome" } } }),
    false,
  );
});

test("shouldDropSentryEvent drops crawler chunk errors only", () => {
  const crawlerChunkEvent = {
    message:
      "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
    tags: { browser: "GoogleOther" },
  };
  assert.equal(shouldDropSentryEvent(crawlerChunkEvent), true);

  const userChunkEvent = {
    exception: {
      values: [
        {
          value:
            "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
        },
      ],
    },
    contexts: { browser: { name: "Chrome" } },
  };
  assert.equal(shouldDropSentryEvent(userChunkEvent), false);
});

test("sentryBeforeSend returns null when event is dropped", () => {
  assert.equal(
    sentryBeforeSend({
      message: "Failed to load chunk /_next/static/chunks/x.js",
      tags: { browser: "Googlebot" },
    }),
    null,
  );
});
