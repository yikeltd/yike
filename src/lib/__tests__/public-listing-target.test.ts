import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("public listing metrics routes use approved-listing guard", () => {
  for (const file of [
    "src/app/api/properties/[id]/view/route.ts",
    "src/app/api/properties/[id]/contact-click/route.ts",
    "src/app/api/analytics/listing-event/route.ts",
  ]) {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    assert.match(src, /isApprovedListingForPublicMetrics/);
  }
});

test("revenue entitlements route scopes to authenticated self", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/revenue/entitlements/[userId]/route.ts"),
    "utf8",
  );
  assert.match(src, /getUser\(\)/);
  assert.match(src, /user\.id !== userId/);
});
