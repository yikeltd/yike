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
  const listing = minimalListing({ agent: undefined });
  assert.equal(sellerContactCardFromListing(listing, "PROPERTY"), null);
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
});

test("marketplace seller contact card uses Message and Call only", () => {
  const src = readFileSync(
    join(root, "components/marketplace/marketplace-seller-contact-card.tsx"),
    "utf8",
  );
  assert.match(src, /SellerMessageCallActions/);
  assert.doesNotMatch(src, /WhatsApp/i);
  assert.doesNotMatch(src, /Make Offer/i);
  assert.doesNotMatch(src, /Escrow/i);
  assert.doesNotMatch(src, /Safe Contact Protocol/i);
});

test("seller reviews preview hides section when total is zero", () => {
  const src = readFileSync(
    join(root, "components/marketplace/seller-contact-reviews-preview.tsx"),
    "utf8",
  );
  assert.match(src, /stats\.total === 0/);
  assert.match(src, /return null/);
  assert.doesNotMatch(src, /placeholder/i);
});

test("property, vehicle, and electronics detail surfaces use shared seller card", () => {
  for (const file of [
    "components/property/agent-contact-card.tsx",
    "components/marketplace/vehicle-detail-experience.tsx",
    "components/marketplace/electronics-detail-experience.tsx",
  ]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(
      src,
      /MarketplaceSellerContactCard|sellerContactCardFromListing/,
      file,
    );
  }
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
