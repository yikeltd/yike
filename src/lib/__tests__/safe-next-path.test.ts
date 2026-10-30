import assert from "node:assert/strict";
import test from "node:test";
import {
  CONSUMER_AUTH_DEFAULT_NEXT,
  safeConsumerAuthNext,
  safeNextPath,
} from "@/lib/auth/safe-next-path";

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

test("safeConsumerAuthNext blocks staff destinations for consumer auth", () => {
  assert.equal(safeConsumerAuthNext("/lex/auth"), CONSUMER_AUTH_DEFAULT_NEXT);
  assert.equal(safeConsumerAuthNext("/lex/auth/overview"), CONSUMER_AUTH_DEFAULT_NEXT);
  assert.equal(safeConsumerAuthNext("/agent/listings"), "/agent/listings");
  assert.equal(safeConsumerAuthNext("//evil.com"), CONSUMER_AUTH_DEFAULT_NEXT);
});
