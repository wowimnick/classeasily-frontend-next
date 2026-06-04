import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from "../lib/chunkLoadError.js";

describe("isChunkLoadError", () => {
  it("detects Turbopack chunk failure messages", () => {
    assert.equal(
      isChunkLoadError(
        new Error(
          "Failed to load chunk /_next/static/chunks/abc.js from module 123",
        ),
      ),
      true,
    );
  });

  it("detects webpack-style chunk failures", () => {
    assert.equal(
      isChunkLoadError(new Error("Loading chunk 42 failed.")),
      true,
    );
  });

  it("detects ChunkLoadError by name", () => {
    const err = new Error("network");
    err.name = "ChunkLoadError";
    assert.equal(isChunkLoadError(err), true);
  });

  it("returns false for unrelated errors", () => {
    assert.equal(isChunkLoadError(new Error("Cannot read property 'x'")), false);
    assert.equal(isChunkLoadError(null), false);
  });
});

describe("tryRecoverFromChunkLoadError", () => {
  it("reloads once per session for chunk errors", () => {
    const storage = new Map();
    let reloadCount = 0;

    globalThis.window = {
      location: { reload: () => {} },
      sessionStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    };
    globalThis.window.location.reload = () => {
      reloadCount += 1;
    };

    const chunkError = new Error("Failed to load chunk /_next/static/chunks/x.js");

    assert.equal(tryRecoverFromChunkLoadError(chunkError), true);
    assert.equal(reloadCount, 1);
    assert.equal(storage.get(CHUNK_RELOAD_SESSION_KEY), "1");

    assert.equal(tryRecoverFromChunkLoadError(chunkError), false);
    assert.equal(reloadCount, 1);

    delete globalThis.window;
  });

  it("does not reload for non-chunk errors", () => {
    let reloadCount = 0;

    globalThis.window = {
      location: { reload: () => {} },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {},
      },
    };
    globalThis.window.location.reload = () => {
      reloadCount += 1;
    };

    assert.equal(tryRecoverFromChunkLoadError(new Error("other")), false);
    assert.equal(reloadCount, 0);

    delete globalThis.window;
  });
});
