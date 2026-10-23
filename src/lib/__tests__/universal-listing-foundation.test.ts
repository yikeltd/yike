import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  UNVERIFIED_AGENT_LISTING_LIMIT,
  getListingLimit,
  countAsActiveListing,
} from "@/lib/agent-tiers";
import {
  normalizeAssetType,
  normalizeListingCondition,
  propertyToListingRow,
} from "@/lib/marketplace/listings";
import {
  verticalFromAssetType,
  MARKETPLACE_VERTICALS,
} from "@/lib/marketplace/verticals";
import type { Property } from "@/types/database";

test("Universal Listing Ceiling defaults to 3 for ordinary sellers regardless of account age", () => {
  assert.equal(UNVERIFIED_AGENT_LISTING_LIMIT, 3);
  assert.equal(getListingLimit(null), 3);
  assert.equal(getListingLimit(undefined), 3);
  assert.equal(getListingLimit({}), 3);
  assert.equal(getListingLimit({ listing_limit: null }), 3);

  // Account age must NOT reduce active listing capacity
  const oldAccount = {
    listing_limit: null,
    subscription_plan_code: "free" as const,
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    starter_plan_started_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  };
  assert.equal(
    getListingLimit(oldAccount),
    3,
    "Older ordinary accounts must still receive 3 active listings",
  );
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

test("Vertical registry recognizes electronics vertical as live", () => {
  assert.equal(verticalFromAssetType("PROPERTY"), "property");
  assert.equal(verticalFromAssetType("VEHICLE"), "vehicle");
  assert.equal(verticalFromAssetType("AUTO"), "vehicle");
  assert.equal(verticalFromAssetType("ELECTRONICS"), "electronics");

  const electronicsVertical = MARKETPLACE_VERTICALS.find((v) => v.id === "electronics");
  assert.ok(electronicsVertical);
  assert.equal(electronicsVertical.assetType, "ELECTRONICS");
  assert.equal(electronicsVertical.status, "live");
});

test("Vehicle condition compatibility: legacy 'new' and 'certified' map to canonical conditions", () => {
  // normalizeListingCondition helper
  assert.equal(normalizeListingCondition("new"), "brand_new");
  assert.equal(normalizeListingCondition("certified"), "refurbished");
  assert.equal(normalizeListingCondition("foreign_used"), "foreign_used");
  assert.equal(normalizeListingCondition("nigerian_used"), "nigerian_used");
  assert.equal(normalizeListingCondition("brand_new"), "brand_new");
  assert.equal(normalizeListingCondition("refurbished"), "refurbished");
  assert.equal(normalizeListingCondition("open_box"), "open_box");
  assert.equal(normalizeListingCondition("for_parts"), "for_parts");
  assert.equal(normalizeListingCondition(null), null);
  assert.equal(normalizeListingCondition(undefined), null);

  const baseProperty: Property = {
    id: "prop_1",
    agent_id: "agent_1",
    title: "Toyota Camry 2020",
    price: 15000000,
    state: "Lagos",
    city: "Ikeja",
    area: "Alausa",
    property_type: null,
    listing_type: "sale",
    slug: "toyota-camry-2020",
    slug_locked: false,
    seo_title: null,
    seo_description: null,
    description: "Brand new vehicle",
    media_urls: ["https://example.com/img1.webp"],
    media_items: [],
    status: "approved",
    is_verified_listing: true,
    yike_verified: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    asset_type: "VEHICLE",
    vehicle_condition: "new",
  } as unknown as Property;

  // Legacy vehicle_condition 'new' maps to canonical 'brand_new'
  const row1 = propertyToListingRow(baseProperty);
  assert.equal(row1.condition, "brand_new");

  // Legacy vehicle_condition 'certified' maps to canonical 'refurbished'
  const certifiedVehicle: Property = {
    ...baseProperty,
    id: "veh_cert",
    vehicle_condition: "certified",
  };
  const row2 = propertyToListingRow(certifiedVehicle);
  assert.equal(row2.condition, "refurbished");

  // Canonical condition takes priority when already canonical
  const canonicalElectronics: Property = {
    ...baseProperty,
    id: "elec_1",
    asset_type: "ELECTRONICS",
    condition: "open_box",
    vehicle_condition: null,
  };
  const row3 = propertyToListingRow(canonicalElectronics);
  assert.equal(row3.condition, "open_box");
});

test("Expiry and capacity consistency: expired listings do not consume active capacity", () => {
  const futureIso = new Date(Date.now() + 86_400_000).toISOString();
  const pastIso = new Date(Date.now() - 86_400_000).toISOString();

  // countAsActiveListing behavior
  assert.equal(countAsActiveListing("approved", futureIso), true);
  assert.equal(countAsActiveListing("pending", futureIso), true);
  assert.equal(countAsActiveListing("flagged", futureIso), true);
  assert.equal(countAsActiveListing("approved", pastIso), false, "Expired listing must not count as active");
  assert.equal(countAsActiveListing("pending", pastIso), false, "Expired pending listing must not count as active");
  assert.equal(countAsActiveListing("archived", futureIso), false);
  assert.equal(countAsActiveListing("rejected", futureIso), false);

  // Seller with 3 listings total, but 1 is expired:
  // Active count should be 2, allowing a 3rd listing immediately without waiting for archival
  const sellerListings = [
    { id: "1", status: "approved", expires_at: futureIso },
    { id: "2", status: "pending", expires_at: futureIso },
    { id: "3", status: "approved", expires_at: pastIso }, // EXPIRED
  ];

  const activeCount = sellerListings.filter((l) => countAsActiveListing(l.status, l.expires_at)).length;
  assert.equal(activeCount, 2);
  assert.equal(activeCount < UNVERIFIED_AGENT_LISTING_LIMIT, true, "Seller can immediately reclaim expired slot");
});

test("Cross-category listing ceiling enforcement: 3 listings combined across Property, Vehicle, and Electronics", () => {
  const sellerId = "agent_universal_1";
  const futureIso = new Date(Date.now() + 86_400_000).toISOString();

  type ListingStub = {
    id: string;
    agent_id: string;
    asset_type: "PROPERTY" | "VEHICLE" | "ELECTRONICS";
    status: "pending" | "approved" | "flagged" | "archived" | "rejected";
    expires_at: string;
  };

  const sellerListings: ListingStub[] = [
    { id: "1", agent_id: sellerId, asset_type: "PROPERTY", status: "approved", expires_at: futureIso },
    { id: "2", agent_id: sellerId, asset_type: "VEHICLE", status: "pending", expires_at: futureIso },
    { id: "3", agent_id: sellerId, asset_type: "ELECTRONICS", status: "flagged", expires_at: futureIso },
  ];

  const activeCount = sellerListings.filter(
    (l) => l.agent_id === sellerId && countAsActiveListing(l.status, l.expires_at),
  ).length;

  const ceiling = UNVERIFIED_AGENT_LISTING_LIMIT; // 3
  assert.equal(activeCount, 3);
  assert.equal(activeCount >= ceiling, true, "Seller should have reached the 3-listing ceiling");

  // Attempting to create a 4th listing (in any category) must be rejected
  const canCreate4th = activeCount < ceiling;
  assert.equal(canCreate4th, false, "4th listing creation should be blocked");
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

  // 6. Expiry filter in trigger to prevent expired listings from blocking capacity
  assert.ok(
    content.includes("(expires_at IS NULL OR expires_at > NOW())"),
    "Trigger count must filter out expired listings",
  );

  // 7. Legacy vehicle condition mapping in backfill and trigger
  assert.ok(
    content.includes("WHEN vehicle_condition = 'new' THEN 'brand_new'"),
    "Migration must map 'new' to 'brand_new'",
  );
  assert.ok(
    content.includes("WHEN vehicle_condition = 'certified' THEN 'refurbished'"),
    "Migration must map 'certified' to 'refurbished'",
  );
  assert.ok(
    content.includes("CREATE OR REPLACE FUNCTION public.sync_listing_condition"),
    "sync_listing_condition function must be defined",
  );
  assert.ok(
    content.includes("trg_sync_listing_condition"),
    "Condition sync trigger must be attached",
  );
});
