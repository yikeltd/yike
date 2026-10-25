import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

test("vehicle dealer contact UI does not expose seller plan copy", () => {
  const src = readFileSync(
    join(root, "components/marketplace/vehicle-dealer-contact-actions.tsx"),
    "utf8"
  );
  assert.doesNotMatch(src, /current plan/i);
  assert.doesNotMatch(src, /phoneReveal\?\.message/);
  assert.match(src, /Call unavailable/);
});

test("vehicle detail experience hides sticky mobile contact bar", () => {
  const src = readFileSync(
    join(root, "components/marketplace/vehicle-detail-experience.tsx"),
    "utf8"
  );
  assert.doesNotMatch(src, /STICKY MOBILE ACTION BAR/);
  assert.match(src, /variant="gallery-inline"/);
  assert.match(src, /hidden pt-2 lg:block/);
  assert.match(src, /isVehicleMechanicInspectionUiVisible/);
  assert.match(src, /isVehicleFinanceEstimatorUiVisible/);
});
