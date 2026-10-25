import test from "node:test";
import assert from "node:assert/strict";
import { staticPathRedirect } from "@/lib/route-redirects";

test("legacy /admin browser paths are not redirected", () => {
  assert.equal(staticPathRedirect("/admin"), null);
  assert.equal(staticPathRedirect("/admin/overview"), null);
  assert.equal(staticPathRedirect("/admin/auth/users"), null);
});

test("staff console aliases still redirect internally", () => {
  assert.equal(staticPathRedirect("/lex/auth/dashboard"), "/lex/auth/overview");
});
