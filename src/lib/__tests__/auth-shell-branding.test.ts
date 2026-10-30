import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("signup and login use logo-only auth header branding", () => {
  const signup = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/auth/signup/signup-form.tsx"),
    "utf8",
  );
  assert.doesNotMatch(signup, /Welcome to Yike/);
  assert.match(signup, /logoShowText=\{false\}/);
  assert.match(signup, /Create your account in under a minute/);

  const login = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/auth/login/login-client.tsx"),
    "utf8",
  );
  assert.match(login, /Welcome Back/);
  assert.match(login, /logoShowText=\{false\}/);
});

test("auth shell defaults preserve wordmark on other auth routes", () => {
  const shell = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/auth/auth-shell.tsx"),
    "utf8",
  );
  assert.match(shell, /logoShowText = true/);
});
