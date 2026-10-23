import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "@/lib/auth/safe-next-path";

test("safeNextPath allows same-origin relative paths", () => {
  assert.equal(safeNextPath("/agent"), "/agent");
  assert.equal(safeNextPath("/search?q=lagos"), "/search?q=lagos");
});

test("safeNextPath blocks open redirects", () => {
  assert.equal(safeNextPath("//evil.com"), "/");
  assert.equal(safeNextPath("https://evil.com"), "/");
  assert.equal(safeNextPath("/\\evil.com"), "/");
  assert.equal(safeNextPath("/%2f%2fevil.com"), "/");
  assert.equal(safeNextPath("javascript:alert(1)"), "/");
});

test("safeNextPath uses fallback for empty input", () => {
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath("", "/profile"), "/profile");
});
