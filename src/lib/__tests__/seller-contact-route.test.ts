import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("seller-contact API requires auth and validates listing seller binding", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/listings/[id]/seller-contact/route.ts"),
    "utf8",
  );
  assert.match(src, /getUser\(\)/);
  assert.match(src, /Sign in required/);
  assert.match(src, /status: 401/);
  assert.match(src, /assetType required/);
  assert.match(src, /resolveListingSeller/);
  assert.match(src, /listingSeller\.sellerId !== sellerId/);
  assert.match(src, /resolveSellerPhoneAccessForBuyer/);
});

test("listing inquiry UI passes assetType to seller-contact", () => {
  const inquiry = readFileSync(
    join(process.cwd(), "src/components/marketplace/listing-inquiry-actions.tsx"),
    "utf8",
  );
  assert.match(inquiry, /assetType/);
  assert.match(inquiry, /seller-contact\?/);

  const vehicle = readFileSync(
    join(process.cwd(), "src/components/marketplace/vehicle-dealer-contact-actions.tsx"),
    "utf8",
  );
  assert.match(vehicle, /assetType: "VEHICLE"/);
});
