import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsername, validateUsername } from "@/lib/username/rules";

test("normalizeUsername lowercases and trims", () => {
  assert.equal(normalizeUsername("  Ada_Owerri  "), "ada_owerri");
});

test("validateUsername rejects reserved and invalid", () => {
  assert.equal(validateUsername("yike").ok, false);
  assert.equal(validateUsername("admin_root").ok, false);
  assert.equal(validateUsername("ab").ok, false);
  assert.equal(validateUsername("_bad").ok, false);
  assert.equal(validateUsername("ok_user_12").ok, true);
});

test("case-insensitive validation normalizes before check", () => {
  const a = validateUsername("MyUser");
  assert.equal(a.ok, true);
  if (a.ok) assert.equal(a.username, "myuser");
});
