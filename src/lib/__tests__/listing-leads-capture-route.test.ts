import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isListingBoundLeadType,
  LISTING_BOUND_LEAD_TYPES,
} from "@/lib/listing-leads/validate-capture-request";

test("listing-bound lead types include save and contact intents", () => {
  assert.ok(LISTING_BOUND_LEAD_TYPES.has("save"));
  assert.ok(LISTING_BOUND_LEAD_TYPES.has("whatsapp"));
  assert.ok(LISTING_BOUND_LEAD_TYPES.has("message"));
  assert.ok(!LISTING_BOUND_LEAD_TYPES.has("follow"));
  assert.equal(isListingBoundLeadType("follow"), false);
  assert.equal(isListingBoundLeadType("save"), true);
});

test("listing-leads capture route validates binding and uses session user id", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/listing-leads/capture/route.ts"),
    "utf8",
  );
  assert.match(route, /validateListingLeadCaptureRequest/);
  assert.match(route, /bound\.sellerId/);
  assert.match(route, /getUser\(\)/);
  assert.match(route, /leadUserId: user\?\.id/);
  assert.doesNotMatch(route, /body\.leadUserId/);

  const validate = readFileSync(
    join(process.cwd(), "src/lib/listing-leads/validate-capture-request.ts"),
    "utf8",
  );
  assert.match(validate, /validateLeadRequest/);
  assert.match(validate, /agent_listing_mismatch/);
  assert.match(validate, /asset_type/);
  assert.match(validate, /listingId not allowed for follow/);
});
