import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("seller verification API response shape excludes internal AI fields", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/agent/seller-verification/route.ts"),
    "utf8"
  );
  assert.match(route, /customerStatus/);
  assert.doesNotMatch(
    route,
    /NextResponse\.json\([\s\S]*confidence[\s\S]*\)\s*;\s*\}\s*$/
  );
  assert.doesNotMatch(route, /reasonCodes.*NextResponse/);
});
