import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  ELECTRONICS_PUBLIC_HREF,
  electronicsImplementationProbe,
  electronicsCreateHref,
  getElectronicsVertical,
  isElectronicsMarketplaceLive,
  rejectCrossVerticalAssetTypePayload,
} from "@/lib/marketplace/electronics-vertical";
import { listingPath } from "@/lib/marketplace/listing-path";
import { getLiveVerticals } from "@/lib/marketplace/verticals";

test("electronics vertical is registered but not live", () => {
  const v = getElectronicsVertical();
  assert.ok(v);
  assert.equal(v!.assetType, "ELECTRONICS");
  assert.equal(v!.status, "reserved");
  assert.equal(isElectronicsMarketplaceLive(), false);
  assert.ok(!getLiveVerticals().some((x) => x.id === "electronics"));
});

test("implementation probe — no public routes or create API yet", () => {
  const probe = electronicsImplementationProbe();
  assert.equal(probe.verticalStatus, "reserved");
  assert.equal(probe.publicAppRouteExists, false);
  assert.equal(probe.sellerCreateRouteExists, false);
  assert.equal(probe.listingEngineCategoryExists, false);
  assert.equal(probe.dedicatedCreateApiExists, false);
});

test("property create API rejects electronics asset_type override", () => {
  const blocked = rejectCrossVerticalAssetTypePayload({ asset_type: "ELECTRONICS" });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.code, "unsupported_asset_type");
  }
  const vehicle = rejectCrossVerticalAssetTypePayload({ asset_type: "VEHICLE" });
  assert.equal(vehicle.ok, false);
  assert.equal(rejectCrossVerticalAssetTypePayload({ asset_type: "PROPERTY" }).ok, true);
  assert.equal(rejectCrossVerticalAssetTypePayload({}).ok, true);
});

test("listingPath routes ELECTRONICS to electronics URL (not property)", () => {
  const path = listingPath({
    id: "e1",
    slug: "iphone-15-pro",
    asset_type: "ELECTRONICS",
  });
  assert.equal(path, `${ELECTRONICS_PUBLIC_HREF}/iphone-15-pro`);
});

test("property search query excludes ELECTRONICS from property feed", () => {
  const src = readFileSync("src/lib/properties.ts", "utf8");
  assert.match(
    src,
    /asset_type\.eq\.PROPERTY/,
    "property feed must filter to PROPERTY rows only",
  );
});

test("vehicle public query scopes to VEHICLE asset_type", () => {
  const src = readFileSync("src/lib/marketplace/listings.ts", "utf8");
  assert.match(src, /\.eq\("asset_type", "VEHICLE"\)/);
});

test("universal listing migration includes ELECTRONICS in trigger count", () => {
  const sql = readFileSync(
    "supabase/migrations/20261013120000_universal_listing_foundation.sql",
    "utf8",
  );
  assert.match(sql, /ELECTRONICS/);
  assert.match(sql, /check_agent_listing_limit/);
});

test("documented create href is reserved until vertical goes live", () => {
  assert.equal(electronicsCreateHref(), "/agent/listings/new/electronics");
});
