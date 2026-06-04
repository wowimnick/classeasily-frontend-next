/**
 * Run: node --test src/__tests__/chunk-load-recovery.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CHUNK_RELOAD_SESSION_KEY,
  clearChunkReloadSession,
  getChunkLoadErrorMessage,
  installChunkLoadRecovery,
  isChunkLoadError,
  planChunkLoadRecovery,
  shouldDropChunkLoadSentryEvent,
} from "../lib/chunk-load-recovery.js";

test("isChunkLoadError matches turbopack and webpack messages", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Failed to load chunk /_next/static/chunks/abc.js?dpl=dpl_x from module 1"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError("Loading chunk 42 failed"), true);
  assert.equal(isChunkLoadError({ name: "ChunkLoadError" }), true);
  assert.equal(isChunkLoadError(new Error("Network request failed")), false);
});

test("planChunkLoadRecovery reloads once per session", () => {
  const storage = new Map();
  const session = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };

  assert.deepEqual(planChunkLoadRecovery(session), { shouldReload: true });
  assert.equal(storage.get(CHUNK_RELOAD_SESSION_KEY), "1");
  assert.deepEqual(planChunkLoadRecovery(session), { shouldReload: false });

  clearChunkReloadSession(session);
  assert.equal(storage.has(CHUNK_RELOAD_SESSION_KEY), false);
});

test("installChunkLoadRecovery triggers a single reload on chunk error", () => {
  let reloadCount = 0;
  const storage = new Map();
  const session = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };
  const listeners = {};
  const priorWindow = globalThis.window;
  globalThis.window = {
    sessionStorage: session,
    addEventListener: (type, fn) => {
      listeners[type] = fn;
    },
    removeEventListener: (type) => {
      delete listeners[type];
    },
  };

  try {
    const cleanup = installChunkLoadRecovery({
      reload: () => {
        reloadCount += 1;
      },
      storage: session,
    });

    listeners.error({
      error: new Error("Failed to load chunk /_next/static/chunks/x.js"),
      message: "Failed to load chunk /_next/static/chunks/x.js",
    });
    cleanup();
    assert.equal(reloadCount, 1);

    installChunkLoadRecovery({
      reload: () => {
        reloadCount += 1;
      },
      storage: session,
    })();
    assert.equal(reloadCount, 1);
  } finally {
    globalThis.window = priorWindow;
  }
});

test("shouldDropChunkLoadSentryEvent filters chunk failures", () => {
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      exception: {
        values: [{ value: "Failed to load chunk /_next/static/chunks/a.js" }],
      },
    }),
    true
  );
  assert.equal(
    shouldDropChunkLoadSentryEvent({
      message: "Something else broke",
    }),
    false
  );
});

test("getChunkLoadErrorMessage unwraps rejection reasons", () => {
  assert.match(
    getChunkLoadErrorMessage({ reason: new Error("Loading chunk 9 failed") }),
    /Loading chunk 9 failed/
  );
});
