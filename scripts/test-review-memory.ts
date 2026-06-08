/**
 * Review memory unit checks — run: npx tsx scripts/test-review-memory.ts
 */
import assert from "node:assert/strict";
import type { Property } from "../src/types/database";
import { computeListingReviewJudgment } from "../src/lib/review-memory/score";
import { scoreNaijaFlexibility } from "../src/lib/review-memory/naija-flex";
import { assignQueueGroup, suggestReviewAction } from "../src/lib/review-memory/suggest";
import { memoryBoostFromHistory } from "../src/lib/review-memory/memory";
import { marketplaceRankAdjustments } from "../src/lib/marketplace-scores";

function baseProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "test-id",
    agent_id: "agent-1",
    title: "3 Bedroom Flat in GRA",
    description:
      "Spacious flat with good road access. Agency fee negotiable with landlord after inspection.",
    price: 1_200_000,
    payment_period: "yearly",
    listing_type: "rent",
    property_type: "flat",
    bedrooms: 3,
    bathrooms: 2,
    state: "Abia",
    city: "Aba",
    area: "GRA",
    media_urls: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"],
    status: "pending",
    is_featured: false,
    featured_until: null,
    is_boosted: false,
    boosted_until: null,
    boost_score: 0,
    sponsored_status: "none",
    is_verified_listing: false,
    views_count: 0,
    contact_clicks: 0,
    expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    extras: {
      agency_fee_mode: "negotiable",
      service_charge_mode: "not_fixed",
      fees_flexible_note: "Service charge to be discussed with landlord directly.",
    },
    ...overrides,
  } as Property;
}

// 1. Every listing gets a review score
const rentJudgment = computeListingReviewJudgment(baseProperty());
assert.ok(rentJudgment.scores.overall >= 0 && rentJudgment.scores.overall <= 100);
assert.ok(rentJudgment.scores.photo >= 0);
assert.ok(rentJudgment.scores.naijaFlex >= 0);

// 2. Scores differ by property type
const landJudgment = computeListingReviewJudgment(
  baseProperty({
    listing_type: "sale",
    property_type: "land",
    title: "Dry Land 600sqm C of O in Enugu",
    description: "Dry land with survey. C of O processing ongoing with governor consent path.",
    payment_period: "total",
    price: 8_000_000,
    city: "Enugu",
    area: "Independence Layout",
  })
);
assert.notEqual(rentJudgment.scores.overall, landJudgment.scores.overall);

const shortletJudgment = computeListingReviewJudgment(
  baseProperty({
    listing_type: "shortlet",
    payment_period: "daily",
    price: 35_000,
    description: "Furnished studio with WiFi and AC. Daily rate.",
    media_urls: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"],
  })
);
assert.ok(shortletJudgment.scores.overall > 0);

// 3. Flexible Naija fee terms accepted when explained
const flex = scoreNaijaFlexibility(baseProperty());
assert.equal(flex.isExplainableFlex, true);
assert.ok(flex.score >= 60);

// 4. Suspicious vague listings flagged
const vague = scoreNaijaFlexibility(
  baseProperty({
    title: "Urgent urgent last plot call for price",
    description: "Hurry pay before viewing",
    price: 0,
    media_urls: [],
    extras: {},
  })
);
assert.ok(vague.vagueSignals.length > 0);
assert.ok(vague.score < flex.score);

const vagueJudgment = computeListingReviewJudgment(
  baseProperty({
    title: "Urgent urgent last plot call for price",
    description: "Hurry pay before viewing",
    price: 0,
    media_urls: [],
    extras: {},
  })
);
assert.ok(vagueJudgment.attention.length > 0);
const vagueAction = suggestReviewAction(vagueJudgment);
assert.notEqual(vagueAction, "approve", "vague listing should not auto-approve");
assert.ok(
  ["ask_explain", "reject", "suspend", "ask_fee_breakdown", "ask_clearer_photos", "request_update"].includes(
    vagueAction
  )
);

// 5–8. Suggested actions and queue groups
assert.ok(suggestReviewAction(rentJudgment));
assert.ok(assignQueueGroup(rentJudgment));

// 10. Decisions feed review memory boost
const boost = memoryBoostFromHistory([
  {
    id: "1",
    listing_id: "l1",
    agent_id: "a1",
    decision_type: "approved_negotiable_landlord_terms",
    decision_reason: null,
    signals: {},
    property_type: null,
    listing_type: "rent",
    scores_snapshot: null,
    admin_id: null,
    created_at: new Date().toISOString(),
  },
]);
assert.ok(boost.naijaFlexBoost > 0);

// 11. Public ranking uses visibility modifier internally, not exposed scores
const rankBase = marketplaceRankAdjustments({
  freshness_score: 50,
  engagement_score: 10,
  inquiry_score: 5,
  hidden_quality_score: 60,
  report_review_recommended: false,
  soft_hold_recommended: false,
  moderation_state: undefined,
  boost_level: 0,
  boost_priority: 0,
  is_boosted: false,
  boosted_until: null,
  review_visibility_modifier: -20,
  review_hold_status: "none",
});
const rankPromoted = marketplaceRankAdjustments({
  freshness_score: 50,
  engagement_score: 10,
  inquiry_score: 5,
  hidden_quality_score: 60,
  report_review_recommended: false,
  soft_hold_recommended: false,
  moderation_state: undefined,
  boost_level: 0,
  boost_priority: 0,
  is_boosted: false,
  boosted_until: null,
  review_visibility_modifier: 10,
  review_hold_status: "none",
});
assert.ok(rankPromoted > rankBase, "silent visibility modifier affects internal rank only");

console.log("review-memory unit checks passed");
