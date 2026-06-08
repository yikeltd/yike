/**
 * Outcome intelligence unit checks — run: npx tsx scripts/test-outcome-intelligence.ts
 */
import assert from "node:assert/strict";
import {
  applyOutcomeToReviewScore,
  agentStrictnessFromQuality,
  computeListingOutcome,
} from "../src/lib/outcome-intelligence/compute";
import { marketplaceRankAdjustments } from "../src/lib/marketplace-scores";

// 1. Listing scores evolve over time
const weakStart = computeListingOutcome({
  views: 5,
  contactClicks: 0,
  inquiryScore: 0,
  engagementScore: 10,
  saveCount: 0,
  openReports: 0,
  misleadingReports: 0,
  inspectionRequests: 0,
  priceChangeCount: 0,
  reactivationCount: 0,
  daysLive: 2,
  postApprovalEditCount: 0,
  wasRapidlyHidden: false,
  possibleDuplicate: false,
  priceAnomalyLevel: null,
  agentResponseRate: 0.5,
  adminPositiveOverride: false,
  adminNegativeOverride: false,
});

const strongLater = computeListingOutcome({
  views: 120,
  contactClicks: 14,
  inquiryScore: 40,
  engagementScore: 55,
  saveCount: 8,
  openReports: 0,
  misleadingReports: 0,
  inspectionRequests: 2,
  priceChangeCount: 1,
  reactivationCount: 0,
  daysLive: 45,
  postApprovalEditCount: 0,
  wasRapidlyHidden: false,
  possibleDuplicate: false,
  priceAnomalyLevel: null,
  agentResponseRate: 0.8,
  adminPositiveOverride: false,
  adminNegativeOverride: false,
});

assert.ok(strongLater.outcomeScore > weakStart.outcomeScore);
assert.ok(strongLater.evolutionDelta > weakStart.evolutionDelta);

const evolved = applyOutcomeToReviewScore(65, strongLater.evolutionDelta);
assert.ok(evolved > 65, "good outcomes should lift evolved review score");

// 2. Good agents gain trust gradually (lighter strictness)
assert.ok(agentStrictnessFromQuality(80) < 0);

// 3. Bad actors lose trust gradually (stricter review)
assert.ok(agentStrictnessFromQuality(30) > 0);

// 4. Negative outcome signals reduce score
const complained = computeListingOutcome({
  views: 80,
  contactClicks: 2,
  inquiryScore: 5,
  engagementScore: 15,
  saveCount: 0,
  openReports: 3,
  misleadingReports: 2,
  inspectionRequests: 0,
  priceChangeCount: 5,
  reactivationCount: 3,
  daysLive: 10,
  postApprovalEditCount: 4,
  wasRapidlyHidden: true,
  possibleDuplicate: true,
  priceAnomalyLevel: "unusually_low",
  agentResponseRate: 0.1,
  adminPositiveOverride: false,
  adminNegativeOverride: true,
});

assert.ok(complained.outcomeScore < weakStart.outcomeScore);
assert.ok(complained.evolutionDelta < 0);
assert.ok(complained.negative.length > 0);

// 5. Human override signals preserved
const withOverride = computeListingOutcome({
  ...JSON.parse(JSON.stringify({
    views: 50,
    contactClicks: 3,
    inquiryScore: 10,
    engagementScore: 20,
    saveCount: 1,
    openReports: 0,
    misleadingReports: 0,
    inspectionRequests: 0,
    priceChangeCount: 0,
    reactivationCount: 0,
    daysLive: 14,
    postApprovalEditCount: 0,
    wasRapidlyHidden: false,
    possibleDuplicate: false,
    priceAnomalyLevel: null,
    agentResponseRate: 0.5,
    adminPositiveOverride: true,
    adminNegativeOverride: false,
  })),
});
assert.ok(withOverride.signals.admin_override_positive === 1);

// 6. Public ranking uses outcome delta internally only
const rankLow = marketplaceRankAdjustments({
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
  review_visibility_modifier: 0,
  review_hold_status: "none",
  outcome_evolution_delta: -10,
});
const rankHigh = marketplaceRankAdjustments({
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
  review_visibility_modifier: 0,
  review_hold_status: "none",
  outcome_evolution_delta: 12,
});
assert.ok(rankHigh > rankLow);

console.log("outcome-intelligence unit checks passed");
