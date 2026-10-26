import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

test("vehicle dealer contact UI delegates to shared Message and Call actions", () => {
  const wrapper = readFileSync(
    join(root, "components/marketplace/vehicle-dealer-contact-actions.tsx"),
    "utf8",
  );
  assert.match(wrapper, /SellerMessageCallActions/);
  const actions = readFileSync(
    join(root, "components/marketplace/seller-message-call-actions.tsx"),
    "utf8",
  );
  assert.doesNotMatch(actions, /current plan/i);
  assert.match(actions, /Call unavailable/);
});

test("vehicle detail experience uses gallery contact and seller section layout", () => {
  const src = readFileSync(
    join(root, "components/marketplace/vehicle-detail-experience.tsx"),
    "utf8",
  );
  assert.match(src, /ListingDetailGalleryContact/);
  assert.match(src, /ListingDetailSellerSection/);
  assert.doesNotMatch(src, /MarketplaceSellerContactCard/);
  assert.match(src, /sellerContactCardFromListing\(vehicle, "VEHICLE"\)/);
  assert.match(src, /isVehicleMechanicInspectionUiVisible/);
  assert.match(src, /isVehicleFinanceEstimatorUiVisible/);
});
