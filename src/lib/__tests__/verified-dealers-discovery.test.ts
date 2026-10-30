import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractDealersFromListings,
  extractVerifiedDealersFromMarketplacePools,
  isEligibleVerifiedDiscoveryAgent,
  resolveDiscoveryDealerCategoryLabel,
} from "@/lib/home/discovery-from-pool";
import {
  VERIFIED_DEALERS_HOME_SUBTITLE,
  VERIFIED_DEALERS_HOME_TITLE,
  resolveVerifiedDealersForHome,
} from "@/lib/home/verified-dealers-section";
import {
  isVerifiedDealersHomeTestMode,
  verifiedDealersFromTestFixture,
} from "@/lib/home/verified-dealers-test-fixtures";
import type { Property } from "@/types/database";

function listing(
  id: string,
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  agent: Record<string, unknown>,
): Property {
  return {
    id,
    asset_type: asset,
    agent: agent as unknown as Property["agent"],
    city: "Lagos",
    state: "Lagos",
  } as Property;
}

test("electronics verified seller with live listing is included with Tech & Electronics label", () => {
  const items = [
    listing("e1", "ELECTRONICS", {
      id: "a1",
      full_name: "Tech Hub",
      account_type: "agent",
      verified_badge: true,
    }),
  ];
  const cards = extractDealersFromListings(items, 8);
  assert.equal(cards.length, 1);
  assert.equal(cards[0]!.categoryLabel, "Tech & Electronics");
});

test("unverified seller with no dealer/developer status is excluded", () => {
  const items = [
    listing("e1", "ELECTRONICS", {
      id: "a2",
      full_name: "Random",
      account_type: "individual",
    }),
  ];
  assert.equal(extractDealersFromListings(items).length, 0);
});

test("verified developer on property pool maps to Property category", () => {
  const agent = {
    id: "dev1",
    company_name: "Urban Dev",
    account_type: "developer" as const,
    developer_verified: true,
  } as unknown as Parameters<typeof isEligibleVerifiedDiscoveryAgent>[0];
  assert.equal(isEligibleVerifiedDiscoveryAgent(agent), true);
  const label = resolveDiscoveryDealerCategoryLabel(agent, {
    property: 3,
    vehicle: 0,
    electronics: 0,
  });
  assert.equal(label, "Property");
});

test("merge pools dedupes agents across verticals", () => {
  const agent = {
    id: "multi",
    company_name: "Mega Motors",
    account_type: "dealer",
    verified_badge: true,
  };
  const cards = extractVerifiedDealersFromMarketplacePools({
    property: [],
    vehicle: [listing("v1", "VEHICLE", agent), listing("v2", "VEHICLE", agent)],
    electronics: [listing("e1", "ELECTRONICS", agent)],
    limit: 5,
  });
  assert.equal(cards.length, 1);
  assert.equal(cards[0]!.listingCount, 3);
});

test("resolveVerifiedDealersForHome hides fixtures when live dealers exist", () => {
  const live = extractDealersFromListings([
    listing("v1", "VEHICLE", {
      id: "d1",
      account_type: "dealer",
      verified_badge: true,
      company_name: "Real Dealer",
    }),
  ]);
  const resolved = resolveVerifiedDealersForHome({
    liveDealers: live,
    showingSampleListingsFixture: true,
  });
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0]!.name, "Real Dealer");
});

test("homepage uses shared verified dealers section on desktop and mobile", () => {
  const mobile = readFileSync(
    join(process.cwd(), "src/components/home/home-marketplace-experience.tsx"),
    "utf8",
  );
  const desktop = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-view.tsx"),
    "utf8",
  );
  assert.match(mobile, /VerifiedDealersHomeSection/);
  assert.match(desktop, /VerifiedDealersHomeSection/);
  assert.match(mobile, /recentCopy\.title/);
  assert.doesNotMatch(mobile, /DealerDiscoveryRow/);
});

test("section copy constants match product spec", () => {
  assert.equal(VERIFIED_DEALERS_HOME_TITLE, "🛡️ Verified Dealers & Developers");
  assert.equal(
    VERIFIED_DEALERS_HOME_SUBTITLE,
    "Trusted businesses with live inventory on Yike",
  );
});

test("test fixture mode yields three eligible vertical dealers", () => {
  assert.equal(isVerifiedDealersHomeTestMode({}), false);
  assert.equal(
    isVerifiedDealersHomeTestMode({ yike_test_verified_dealers: "1" }),
    process.env.NODE_ENV !== "production",
  );
  const cards = verifiedDealersFromTestFixture();
  assert.equal(cards.length, 3);
  const labels = new Set(cards.map((c) => c.categoryLabel));
  assert.ok(labels.has("Property"));
  assert.ok(labels.has("Vehicles"));
  assert.ok(labels.has("Tech & Electronics"));
});

test("resolveVerifiedDealersForHome returns empty without live or demo flags", () => {
  const resolved = resolveVerifiedDealersForHome({
    liveDealers: [],
    showingDemoFixtures: false,
    showingSampleListingsFixture: false,
  });
  assert.equal(resolved.length, 0);
});

test("dealer row uses tighter gaps and overflow-safe layout", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/marketplace/experience/dealer-discovery-row.tsx"),
    "utf8",
  );
  assert.match(src, /gap-2/);
  assert.match(src, /truncate/);
  assert.match(src, /data-testid/);
});
