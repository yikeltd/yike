import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveAccountHomePath,
  resolveProfilePath,
} from "@/lib/account/account-home";
import type { Profile } from "@/types/database";

function profile(role: Profile["role"]): Pick<Profile, "role"> {
  return { role };
}

test("resolveProfilePath sends consumers and agents to canonical /agent", () => {
  assert.equal(resolveProfilePath(profile("user")), "/agent");
  assert.equal(resolveProfilePath(profile("agent")), "/agent");
  assert.equal(resolveProfilePath(profile("agent_unverified")), "/agent");
});

test("resolveProfilePath sends staff to console", () => {
  assert.equal(resolveProfilePath(profile("admin")), "/lex/auth/overview");
});

test("resolveAccountHomePath sends consumers to profile not saved", () => {
  assert.equal(resolveAccountHomePath(profile("user")), "/agent");
});

test("resolveAccountHomePath sends listers to listings hub", () => {
  assert.equal(resolveAccountHomePath(profile("agent")), "/agent/listings");
  assert.equal(resolveAccountHomePath(profile("agent_unverified")), "/agent/listings");
});

test("saved listings route is not used as profile destination", () => {
  assert.notEqual(resolveProfilePath(profile("user")), "/saved");
  assert.notEqual(resolveProfilePath(profile("agent")), "/saved");
});
