import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sellerContactCardFromListing } from "@/lib/marketplace/seller-contact-card-props";
import type { Property } from "@/types/database";

const root = join(process.cwd(), "src");

function minimalListing(overrides: Partial<Property> = {}): Property {
  return {
    id: "listing-1",
    agent: {
      id: "agent-1",
      full_name: "Emeka Seller",
      company_name: null,
      avatar_url: null,
      is_responsive: false,
      performance_score: null,
      avg_response_time_minutes: null,
      inquiry_count: 0,
    },
    is_verified_listing: false,
    ...overrides,
  } as Property;
}

test("sellerContactCardFromListing returns null without agent id", () => {
  const listing = minimalListing({ agent: undefined, agent_id: null as unknown as string });
  assert.equal(sellerContactCardFromListing(listing, "PROPERTY"), null);
});

test("sellerContactCardFromListing accepts agent_id when agent embed is missing", () => {
  const listing = minimalListing({
    agent: undefined,
    agent_id: "agent-fallback",
  });
  const card = sellerContactCardFromListing(listing, "VEHICLE");
  assert.ok(card);
  assert.equal(card!.sellerId, "agent-fallback");
});

test("sellerContactCardFromListing uses real response time when inquiries exist", () => {
  const listing = minimalListing({
    agent: {
      id: "agent-1",
      full_name: "Emeka Seller",
      avg_response_time_minutes: 12,
      inquiry_count: 5,
    } as Property["agent"],
  });
  const card = sellerContactCardFromListing(listing, "PROPERTY");
  assert.ok(card);
  assert.match(card!.responseLabel ?? "", /Replies in <12 min/);
});

test("sellerContactCardFromListing omits trust score when performance_score missing", () => {
  const card = sellerContactCardFromListing(minimalListing(), "VEHICLE");
  assert.ok(card);
  assert.equal(card!.trustScoreLabel, null);
  assert.equal(card!.profileHeadline, "Seller on Yike");
});

test("verified agent gets reference profile headline and trust score from data", () => {
  const listing = minimalListing({
    agent: {
      id: "agent-1",
      full_name: "Emeka Seller",
      verified_badge: true,
      performance_score: 95,
      inquiry_count: 0,
    } as Property["agent"],
  });
  const card = sellerContactCardFromListing(listing, "ELECTRONICS");
  assert.ok(card);
  assert.equal(card!.profileHeadline, "Verified Nigerian Seller");
  assert.equal(card!.trustScoreLabel, "95 / 100 Trust Score");
});

test("marketplace seller contact card omits duplicate Message and Call actions", () => {
  const src = readFileSync(
    join(root, "components/marketplace/marketplace-seller-contact-card.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /SellerMessageCallActions/);
  assert.doesNotMatch(src, /WhatsApp/i);
  assert.doesNotMatch(src, /Make Offer/i);
  assert.doesNotMatch(src, /Escrow/i);
  assert.doesNotMatch(src, /Safe Contact Protocol/i);
});

test("seller reviews preview uses honest empty state on listing detail", () => {
  const preview = readFileSync(
    join(root, "components/marketplace/seller-contact-reviews-preview.tsx"),
    "utf8",
  );
  assert.match(preview, /total === 0/);
  assert.match(preview, /showEmptyState/);
  assert.match(preview, /seller-reviews-empty/);
  assert.doesNotMatch(preview, /placeholder/i);
});

test("property, vehicle, and electronics detail surfaces use listing seller section", () => {
  for (const file of [
    "components/property/property-detail-experience.tsx",
    "components/marketplace/vehicle-detail-experience.tsx",
    "components/marketplace/electronics-detail-experience.tsx",
  ]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailSellerSection/, file);
    assert.match(src, /sellerContactCardFromListing/, file);
  }
});

test("seller role labels do not imply verification in copy", () => {
  const card = sellerContactCardFromListing(minimalListing(), "VEHICLE");
  assert.ok(card);
  assert.doesNotMatch(card!.roleLabel, /verified/i);
  const electronics = sellerContactCardFromListing(minimalListing(), "ELECTRONICS");
  assert.ok(electronics);
  assert.doesNotMatch(electronics!.roleLabel, /verified/i);
});

test("seller message call actions wire conversations and seller-contact APIs", () => {
  const src = readFileSync(
    join(root, "components/marketplace/seller-message-call-actions.tsx"),
    "utf8",
  );
  assert.match(src, /\/api\/conversations/);
  assert.match(src, /seller-contact/);
  assert.match(src, /"Message"/);
  assert.match(src, /Call unavailable/);
});

test("reviews agent API returns empty reviews when stats total is zero", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/reviews/agent/[agentId]/route.ts"),
    "utf8",
  );
  assert.match(src, /getReviewStats/);
  assert.match(src, /stats\.total === 0/);
});
