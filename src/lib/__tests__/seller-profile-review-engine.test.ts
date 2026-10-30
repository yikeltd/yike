import test from "node:test";
import assert from "node:assert/strict";
import {
  canAutoApproveSellerProfile,
  evaluateSellerProfileRules,
  mergeProfileReviewResults,
  parseLlmReviewPayload,
  SELLER_PROFILE_REVIEW_CONFIG,
} from "@/lib/seller-trust/profile-review-engine";

const baseInput = {
  userId: "user-a",
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  phone: "08031234567",
  phoneVerified: true,
  dateOfBirth: "1990-06-15",
  residentialAddress: "12 Admiralty Way, Lekki",
  residentialState: "Lagos",
  occupation: "Engineer",
  isBanned: false,
  priorRejection: false,
  duplicatePhoneUserIds: [] as string[],
  duplicateEmailUserIds: [] as string[],
};

test("high-confidence complete profile is eligible for auto-approve", () => {
  const review = evaluateSellerProfileRules(baseInput);
  assert.equal(review.recommendation, "approve");
  assert.ok(review.confidence >= SELLER_PROFILE_REVIEW_CONFIG.autoApproveMinConfidence);
  assert.equal(canAutoApproveSellerProfile(review, baseInput), true);
});

test("duplicate phone blocks auto-approve", () => {
  const review = evaluateSellerProfileRules({
    ...baseInput,
    duplicatePhoneUserIds: ["other-user"],
  });
  assert.equal(review.recommendation, "review");
  assert.equal(canAutoApproveSellerProfile(review, baseInput), false);
});

test("provider error never auto-approves", () => {
  const rules = evaluateSellerProfileRules(baseInput);
  const merged = mergeProfileReviewResults(rules, {
    recommendation: "approve",
    confidence: 0.99,
    reasonCodes: ["provider_unavailable"],
    modelVersion: "openai-test",
    schemaValid: false,
    providerError: true,
  });
  assert.equal(merged.recommendation, "review");
  assert.equal(canAutoApproveSellerProfile(merged, baseInput), false);
});

test("malformed LLM output fails schema validation", () => {
  assert.equal(parseLlmReviewPayload({ recommendation: "maybe", confidence: 1 }), null);
  assert.equal(parseLlmReviewPayload({ recommendation: "approve" }), null);
});

test("merge takes stricter recommendation and minimum confidence", () => {
  const rules = evaluateSellerProfileRules(baseInput);
  const llm = {
    recommendation: "review" as const,
    confidence: 0.5,
    reasonCodes: ["policy_sensitive" as const],
    modelVersion: "openai-test",
    schemaValid: true,
    providerError: false,
  };
  const merged = mergeProfileReviewResults(rules, llm);
  assert.equal(merged.recommendation, "review");
  assert.ok(merged.confidence <= 0.5);
});
