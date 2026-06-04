import assert from "node:assert/strict";
import test from "node:test";
import {
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunk-load-recovery.js";
import { isLikelyBot, sentryBeforeSend } from "../lib/sentry-filters.js";

test("isChunkLoadError matches Turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/25d5818057eb0fb6.js from module 964893",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 42 failed")), true);
  assert.equal(isChunkLoadError(new Error("ChunkLoadError")), true);
  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module")),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("tryRecoverFromChunkLoadError reloads once per session", () => {
  const reloadCalls = [];
  globalThis.window = {
    location: { reload: () => reloadCalls.push("reload") },
  };
  globalThis.sessionStorage = {
    store: new Map(),
    getItem(key) {
      return this.store.get(key) ?? null;
    },
    setItem(key, value) {
      this.store.set(key, value);
    },
  };

  const error = new Error("Failed to load chunk /_next/static/chunks/foo.js");
  assert.equal(tryRecoverFromChunkLoadError(error), true);
  assert.equal(reloadCalls.length, 1);
  assert.equal(tryRecoverFromChunkLoadError(error), false);
  assert.equal(reloadCalls.length, 1);

  delete globalThis.window;
  delete globalThis.sessionStorage;
});

test("sentryBeforeSend drops bots and chunk load errors", () => {
  assert.equal(
    sentryBeforeSend(
      { tags: { "browser.name": "GoogleOther" } },
      { originalException: new Error("anything") },
    ),
    null,
  );

  assert.equal(
    sentryBeforeSend(
      { title: "Error: Failed to load chunk /_next/static/chunks/x.js" },
      {},
    ),
    null,
  );

  const kept = sentryBeforeSend(
    { title: "TypeError: Cannot read properties of undefined" },
    { originalException: new Error("Cannot read properties of undefined") },
  );
  assert.ok(kept);
  assert.equal(isLikelyBot({ tags: { "browser.name": "Chrome" } }), false);
});
