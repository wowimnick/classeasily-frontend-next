/**
 * Regression tests for admin Table dataSource handling of paginated API responses.
 * Run: node --test src/__tests__/admin-paginated-data.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

/** Mirrors UserAccessControl fetchData unwrapping for verification requests. */
function unwrapVerificationResults(response) {
  return response.success ? response.data?.results || [] : [];
}

test("unwraps paginated verification results for Ant Design Table dataSource", () => {
  const paginated = {
    success: true,
    data: {
      count: 2,
      next: null,
      previous: null,
      results: [{ id: 1 }, { id: 2 }],
    },
  };

  const rows = unwrapVerificationResults(paginated);
  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 2);
});

test("does not pass paginated envelope object to Table dataSource", () => {
  const paginated = {
    success: true,
    data: { count: 0, next: null, previous: null, results: [] },
  };

  const rows = unwrapVerificationResults(paginated);
  assert.equal(typeof rows.some, "function");
  assert.equal(rows.some(() => true), false);
});

test("returns empty array when request fails", () => {
  assert.deepEqual(unwrapVerificationResults({ success: false }), []);
});
