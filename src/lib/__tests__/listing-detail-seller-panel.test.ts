import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  sellerContactCardFromListing,
  sellerProfileHeadline,
} from "@/lib/marketplace/seller-contact-card-props";
import type { Property } from "@/types/database";

const root = join(process.cwd(), "src");

test("profile headline follows verification without hardcoded trust metrics", () => {
  assert.equal(sellerProfileHeadline(true), "Verified Nigerian Seller");
  assert.equal(sellerProfileHeadline(false), "Seller on Yike");
});

test("seller identity omits trust and response labels without agent data", () => {
  const listing = {
    id: "l1",
    agent_id: "a1",
    agent: {
      id: "a1",
      full_name: "Ada",
      performance_score: null,
      inquiry_count: 0,
      avg_response_time_minutes: null,
    },
  } as Property;
  const card = sellerContactCardFromListing(listing, "PROPERTY");
  assert.ok(card);
  assert.equal(card!.trustScoreLabel, null);
  assert.equal(card!.responseLabel, null);
  assert.equal(card!.profileHeadline, "Seller on Yike");
});

test("listing detail seller panel structure matches reference layout", () => {
  const card = readFileSync(
    join(root, "components/marketplace/marketplace-seller-contact-card.tsx"),
    "utf8",
  );
  const reviews = readFileSync(
    join(root, "components/marketplace/seller-contact-reviews-preview.tsx"),
    "utf8",
  );
  assert.match(card, /ListingDetailSellerPanel/);
  assert.match(card, /profileHeadline/);
  assert.match(card, /seller-panel-divider/);
  assert.match(card, /variant="listingDetail"/);
  assert.doesNotMatch(card, /SellerMessageCallActions/);
  assert.match(reviews, /md:grid-cols-3/);
  assert.match(reviews, /seller-reviews-empty/);
  assert.match(reviews, /Reviews &amp; feedback/);
});

test("location section omits address disclosure disclaimer", () => {
  const loc = readFileSync(
    join(root, "components/marketplace/listing-detail-location-section.tsx"),
    "utf8",
  );
  assert.doesNotMatch(loc, /disclosed after contact/i);
});
