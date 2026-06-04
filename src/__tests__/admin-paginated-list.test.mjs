import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Mirrors verificationService.getVerificationRequests list normalization */
function normalizePaginatedList(payload) {
  const rows = payload?.results ?? payload;
  return Array.isArray(rows) ? rows : [];
}

describe("normalizePaginatedList", () => {
  it("unwraps DRF paginated { results: [...] }", () => {
    const list = [{ id: 1 }, { id: 2 }];
    assert.deepEqual(
      normalizePaginatedList({ count: 2, next: null, previous: null, results: list }),
      list
    );
  });

  it("passes through a bare array", () => {
    const list = [{ id: "a" }];
    assert.deepEqual(normalizePaginatedList(list), list);
  });

  it("returns [] when payload is a non-array object (Table dataSource bug)", () => {
    assert.deepEqual(normalizePaginatedList({ count: 0, next: null, previous: null }), []);
  });

  it("returns [] for null/undefined", () => {
    assert.deepEqual(normalizePaginatedList(null), []);
    assert.deepEqual(normalizePaginatedList(undefined), []);
  });
});
