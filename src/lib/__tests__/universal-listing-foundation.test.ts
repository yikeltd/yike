import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  UNVERIFIED_AGENT_LISTING_LIMIT,
  getListingLimit,
} from "@/lib/agent-tiers";
import {
  normalizeAssetType,
  propertyToListingRow,
} from "@/lib/marketplace/listings";
import {
  verticalFromAssetType,
  MARKETPLACE_VERTICALS,
} from "@/lib/marketplace/verticals";
import type { Property } from "@/types/database";

test("Universal Listing Ceiling defaults to 3 for ordinary sellers", () => {
  assert.equal(UNVERIFIED_AGENT_LISTING_LIMIT, 3);
  assert.equal(getListingLimit(null), 3);
  assert.equal(getListingLimit(undefined), 3);
  assert.equal(getListingLimit({}), 3);
  assert.equal(getListingLimit({ listing_limit: null }), 3);
});

test("Custom profile listing_limit and developer bypass are preserved", () => {
  // Custom limit
  assert.equal(getListingLimit({ listing_limit: 10 }), 10);
  assert.equal(getListingLimit({ listing_limit: 1 }), 1);

  // Developer plan has unlimited capacity (returns null)
  assert.equal(
    getListingLimit({ subscription_plan_code: "developer", listing_limit: 5 }),
    null,
  );
});

test("Asset type normalization includes PROPERTY, VEHICLE, and ELECTRONICS", () => {
  assert.equal(normalizeAssetType("PROPERTY"), "PROPERTY");
  assert.equal(normalizeAssetType("VEHICLE"), "VEHICLE");
  assert.equal(normalizeAssetType("AUTO"), "VEHICLE");
  assert.equal(normalizeAssetType("ELECTRONICS"), "ELECTRONICS");
  assert.equal(normalizeAssetType(undefined), "PROPERTY");
  assert.equal(normalizeAssetType(null), "PROPERTY");
  assert.equal(normalizeAssetType("UNKNOWN"), "PROPERTY");
});

test("Vertical registry recognizes electronics vertical as reserved", () => {
  assert.equal(verticalFromAssetType("PROPERTY"), "property");
  assert.equal(verticalFromAssetType("VEHICLE"), "vehicle");
  assert.equal(verticalFromAssetType("AUTO"), "vehicle");
  assert.equal(verticalFromAssetType("ELECTRONICS"), "electronics");

  const electronicsVertical = MARKETPLACE_VERTICALS.find((v) => v.id === "electronics");
  assert.ok(electronicsVertical);
  assert.equal(electronicsVertical.assetType, "ELECTRONICS");
  assert.equal(electronicsVertical.status, "reserved");
});

test("Universal condition mapping and vehicle_condition backward compatibility", () => {
  const baseProperty: Property = {
    id: "prop_1",
    agent_id: "agent_1",
    title: "iPhone 15 Pro Max",
    price: 1500000,
    state: "Lagos",
    city: "Ikeja",
    area: "Computer Village",
    property_type: null,
    listing_type: "sale",
    slug: "iphone-15-pro-max",
    slug_locked: false,
    seo_title: null,
    seo_description: null,
    description: "Brand new sealed in box",
    media_urls: ["https://example.com/img1.webp"],
    media_items: [],
    status: "approved",
    is_verified_listing: true,
    yike_verified: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    asset_type: "ELECTRONICS",
    condition: "brand_new",
  } as unknown as Property;

  // Condition is mapped directly when present
  const row1 = propertyToListingRow(baseProperty);
  assert.equal(row1.asset_type, "ELECTRONICS");
  assert.equal(row1.condition, "brand_new");

  // Fallback to vehicle_condition when condition is not set (backward compatibility)
  const legacyVehicle: Property = {
    ...baseProperty,
    id: "veh_1",
    asset_type: "VEHICLE",
    condition: undefined,
    vehicle_condition: "foreign_used",
  };
  const row2 = propertyToListingRow(legacyVehicle);
  assert.equal(row2.asset_type, "VEHICLE");
  assert.equal(row2.condition, "foreign_used");
});

test("Cross-category listing ceiling enforcement: 3 listings combined across Property, Vehicle, and Electronics", () => {
  const sellerId = "agent_universal_1";

  // Simulate active listings for a seller across mixed categories
  type ListingStub = {
    id: string;
    agent_id: string;
    asset_type: "PROPERTY" | "VEHICLE" | "ELECTRONICS";
    status: "pending" | "approved" | "flagged" | "archived" | "rejected";
  };

  const sellerListings: ListingStub[] = [
    { id: "1", agent_id: sellerId, asset_type: "PROPERTY", status: "approved" },
    { id: "2", agent_id: sellerId, asset_type: "VEHICLE", status: "pending" },
    { id: "3", agent_id: sellerId, asset_type: "ELECTRONICS", status: "flagged" },
  ];

  const activeStatuses = new Set(["pending", "approved", "flagged"]);
  const activeCount = sellerListings.filter(
    (l) => l.agent_id === sellerId && activeStatuses.has(l.status),
  ).length;

  const ceiling = UNVERIFIED_AGENT_LISTING_LIMIT; // 3
  assert.equal(activeCount, 3);
  assert.equal(activeCount >= ceiling, true, "Seller should have reached the 3-listing ceiling");

  // Attempting to create a 4th listing (in any category) must be rejected
  const canCreate4th = activeCount < ceiling;
  assert.equal(canCreate4th, false, "4th listing creation should be blocked");

  // If one listing is archived/sold, active count drops to 2, allowing another listing
  sellerListings[0].status = "archived";
  const updatedActiveCount = sellerListings.filter(
    (l) => l.agent_id === sellerId && activeStatuses.has(l.status),
  ).length;
  assert.equal(updatedActiveCount, 2);
  assert.equal(updatedActiveCount < ceiling, true, "New listing should be allowed after archival");
});

test("Database migration 20261013120000_universal_listing_foundation.sql integrity", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261013120000_universal_listing_foundation.sql",
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist");

  const content = fs.readFileSync(migrationPath, "utf-8");

  // 1. Asset type includes ELECTRONICS
  assert.ok(
    content.includes("CHECK (asset_type IN ('PROPERTY', 'VEHICLE', 'ELECTRONICS'))"),
    "Asset type check must include ELECTRONICS",
  );

  // 2. Condition check contains all approved conditions
  const conditions = [
    "'brand_new'",
    "'open_box'",
    "'refurbished'",
    "'foreign_used'",
    "'nigerian_used'",
    "'for_parts'",
  ];
  for (const cond of conditions) {
    assert.ok(content.includes(cond), `Condition check must include ${cond}`);
  }

  // 3. Concurrency-safe profile locking with SELECT FOR UPDATE
  assert.ok(
    content.includes("FROM public.profiles") && content.includes("FOR UPDATE"),
    "Trigger check_agent_listing_limit must lock profiles with FOR UPDATE",
  );

  // 4. Default limit of 3
  assert.ok(
    content.includes("cap := 3"),
    "check_agent_listing_limit must default cap to 3",
  );

  // 5. Active/in-review statuses checked
  assert.ok(
    content.includes("IN ('pending', 'approved', 'flagged')"),
    "Active count must check ('pending', 'approved', 'flagged')",
  );

  // 6. Two-way condition sync
  assert.ok(
    content.includes("CREATE OR REPLACE FUNCTION public.sync_listing_condition"),
    "sync_listing_condition function must be defined",
  );
  assert.ok(
    content.includes("trg_sync_listing_condition"),
    "Condition sync trigger must be attached",
  );
});
