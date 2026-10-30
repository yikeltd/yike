import test from "node:test";
import assert from "node:assert/strict";
import { resolveLoginSurface } from "@/lib/auth/login-ui-state";

test("resolveLoginSurface prefers PIN when quick user and not forced", () => {
  assert.equal(
    resolveLoginSurface({
      hasQuickUser: true,
      showPasswordForm: false,
      forcePassword: false,
    }),
    "pin"
  );
});

test("resolveLoginSurface uses password when forced or no quick user", () => {
  assert.equal(
    resolveLoginSurface({
      hasQuickUser: true,
      showPasswordForm: true,
      forcePassword: false,
    }),
    "password"
  );
  assert.equal(
    resolveLoginSurface({
      hasQuickUser: true,
      showPasswordForm: false,
      forcePassword: true,
    }),
    "password"
  );
  assert.equal(
    resolveLoginSurface({
      hasQuickUser: false,
      showPasswordForm: false,
      forcePassword: false,
    }),
    "password"
  );
});
