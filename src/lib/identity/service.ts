/**
 * Identity Platform & Reputation Engine — Service Core (Phase 1.3)
 *
 * Computes dynamic Trust Score (0-100), awards data-driven Badges, manages Verifications,
 * and generates transparent Trust Audit Reports.
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import type {
  BadgeId,
  ProfileType,
  ReputationMetrics,
  TrustAuditReport,
  TrustBadge,
  TrustIdentity,
  TrustLevel,
  TrustScoreBreakdown,
  TrustScoreSignal,
  VerificationRecord,
  VerificationType,
} from "./types";

// In-memory Trust Identity repository
const identityStore = new Map<string, TrustIdentity>();

/** Configurable Signal Weights for Trust Score Engine */
export const TRUST_SCORE_WEIGHTS = {
  IDENTITY_NIN: 30, // NIN / Govt ID verification
  BUSINESS_CAC: 20, // CAC Business registration
  PHONE_EMAIL: 10, // Phone + Email verification
  SUCCESSFUL_DEALS: 15, // Successful transactions volume & completion rate
  RESPONSE_METRICS: 10, // Fast response time (<30 mins) & high response rate (>90%)
  REVIEWS_RATING: 15, // 4.5+ star rating average
  DISPUTE_PENALTY: 15, // Penalty per unresolved dispute
};

/** Compute dynamic Trust Score (0–100) and detailed signal breakdown */
export function calculateTrustScore(
  verifications: VerificationRecord[],
  reputation: ReputationMetrics
): TrustScoreBreakdown {
  const now = new Date().toISOString();
  const signals: TrustScoreSignal[] = [];

  // 1. Identity NIN Signal (max 30 pts)
  const isNinVerified = verifications.some((v) => v.verificationType === "identity_nin" && v.status === "verified");
  signals.push({
    category: "identity",
    label: "National Identity Verification (NIN)",
    pointsEarned: isNinVerified ? 30 : 0,
    maxPoints: 30,
    description: isNinVerified ? "Verified against National Identity Registry" : "NIN verification pending",
  });

  // 2. Business CAC Signal (max 20 pts)
  const isCacVerified = verifications.some((v) => v.verificationType === "business_cac" && v.status === "verified");
  signals.push({
    category: "business",
    label: "CAC Business Registration",
    pointsEarned: isCacVerified ? 20 : 0,
    maxPoints: 20,
    description: isCacVerified ? "Corporate Affairs Commission status active" : "Business registration unverified",
  });

  // 3. Contact Verification (Phone + Email) (max 10 pts)
  const isPhoneVerified = verifications.some((v) => v.verificationType === "phone" && v.status === "verified");
  const isEmailVerified = verifications.some((v) => v.verificationType === "email" && v.status === "verified");
  let contactPts = 0;
  if (isPhoneVerified) contactPts += 5;
  if (isEmailVerified) contactPts += 5;
  signals.push({
    category: "identity",
    label: "Phone & Email Verification",
    pointsEarned: contactPts,
    maxPoints: 10,
    description: `Phone (${isPhoneVerified ? "✓" : "✗"}), Email (${isEmailVerified ? "✓" : "✗"})`,
  });

  // 4. Successful Deals & Activity (max 15 pts)
  let dealPts = 0;
  if (reputation.completedDeals >= 1) dealPts += 5;
  if (reputation.completedDeals >= 5) dealPts += 5;
  if (reputation.completedDeals >= 15) dealPts += 5;
  signals.push({
    category: "activity",
    label: "Completed Marketplace Deals",
    pointsEarned: dealPts,
    maxPoints: 15,
    description: `${reputation.completedDeals} verified completed transactions`,
  });

  // 5. Response Speed & Rate (max 10 pts)
  let respPts = 0;
  if (reputation.responseRatePercentage >= 90) respPts += 5;
  if (reputation.averageResponseTimeMinutes <= 30) respPts += 5;
  signals.push({
    category: "responsiveness",
    label: "Response Speed & Rate",
    pointsEarned: respPts,
    maxPoints: 10,
    description: `Response rate: ${reputation.responseRatePercentage}%, Avg time: ${reputation.averageResponseTimeMinutes} mins`,
  });

  // 6. Review Rating Quality (max 15 pts)
  let reviewPts = 0;
  if (reputation.averageRating >= 4.0) reviewPts += 5;
  if (reputation.averageRating >= 4.5) reviewPts += 5;
  if (reputation.buyerReviewsCount + reputation.sellerReviewsCount >= 5) reviewPts += 5;
  signals.push({
    category: "reviews",
    label: "Ratings & Review Quality",
    pointsEarned: reviewPts,
    maxPoints: 15,
    description: `Average rating: ${reputation.averageRating.toFixed(1)}★ across ${reputation.buyerReviewsCount + reputation.sellerReviewsCount} reviews`,
  });

  // 7. Dispute Penalty Deductions
  const penalty = Math.min(reputation.disputeCount * 15, 30);
  if (penalty > 0) {
    signals.push({
      category: "disputes",
      label: "Dispute Deductions",
      pointsEarned: -penalty,
      maxPoints: 0,
      description: `${reputation.disputeCount} active dispute penalty deductions`,
    });
  }

  const rawTotal = signals.reduce((sum, s) => sum + s.pointsEarned, 0);
  const overallScore = Math.max(0, Math.min(100, rawTotal));

  let trustLevel: TrustLevel = "bronze";
  if (overallScore >= 90) trustLevel = "platinum";
  else if (overallScore >= 75) trustLevel = "gold";
  else if (overallScore >= 50) trustLevel = "silver";

  return {
    overallScore,
    trustLevel,
    signals,
    calculatedAt: now,
  };
}

/** Evaluate and award dynamic data-driven Badges */
export function evaluateBadges(
  verifications: VerificationRecord[],
  reputation: ReputationMetrics,
  scoreBreakdown: TrustScoreBreakdown
): TrustBadge[] {
  const now = new Date().toISOString();
  const badges: TrustBadge[] = [];

  const isNin = verifications.some((v) => v.verificationType === "identity_nin" && v.status === "verified");
  if (isNin) {
    badges.push({
      id: "verified_identity",
      label: "NIN Verified",
      description: "Government identity verified via NIN Registry",
      iconName: "UserCheck",
      style: "blue",
      awardedAt: now,
    });
  }

  const isCac = verifications.some((v) => v.verificationType === "business_cac" && v.status === "verified");
  if (isCac) {
    badges.push({
      id: "verified_business",
      label: "CAC Verified",
      description: "Corporate registration verified with CAC Nigeria",
      iconName: "Building2",
      style: "gold",
      awardedAt: now,
    });
  }

  if (reputation.responseRatePercentage >= 90 && reputation.averageResponseTimeMinutes <= 30) {
    badges.push({
      id: "fast_responder",
      label: "Fast Responder",
      description: "Responds to inquiries within 30 minutes",
      iconName: "Zap",
      style: "emerald",
      awardedAt: now,
    });
  }

  if (reputation.completedDeals >= 5 && reputation.averageRating >= 4.5) {
    badges.push({
      id: "trusted_seller",
      label: "Trusted Seller",
      description: "High deal volume with 4.5+ star rating",
      iconName: "Award",
      style: "purple",
      awardedAt: now,
    });
  }

  const hasInspection = verifications.some(
    (v) => v.verificationType === "inspection_participation" && v.status === "verified"
  );
  if (hasInspection) {
    badges.push({
      id: "inspection_ready",
      label: "Yike Inspected",
      description: "Listings passed 50-Point Field Inspection",
      iconName: "ShieldCheck",
      style: "emerald",
      awardedAt: now,
    });
  }

  return badges;
}

/** Get or create Trust Identity (Yike Passport) for user */
export async function getOrCreateTrustIdentity(
  userId: string,
  defaults?: { fullName?: string; email?: string; profileType?: ProfileType }
): Promise<TrustIdentity> {
  const existing = identityStore.get(userId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const initialVerifications: VerificationRecord[] = [
    {
      id: `v_phone_${Date.now()}`,
      userId,
      verificationType: "phone",
      status: "verified",
      verifiedAt: now,
    },
    {
      id: `v_email_${Date.now()}`,
      userId,
      verificationType: "email",
      status: "verified",
      verifiedAt: now,
    },
    {
      id: `v_nin_${Date.now()}`,
      userId,
      verificationType: "identity_nin",
      status: "verified",
      verifiedAt: "2026-07-20T10:00:00Z",
    },
    {
      id: `v_cac_${Date.now()}`,
      userId,
      verificationType: "business_cac",
      status: "verified",
      verifiedAt: "2026-07-22T14:30:00Z",
    },
    {
      id: `v_insp_${Date.now()}`,
      userId,
      verificationType: "inspection_participation",
      status: "verified",
      verifiedAt: "2026-07-25T16:00:00Z",
    },
  ];

  const initialReputation: ReputationMetrics = {
    completedDeals: 18,
    cancelledDeals: 1,
    buyerReviewsCount: 14,
    sellerReviewsCount: 4,
    averageRating: 4.9,
    averageResponseTimeMinutes: 14,
    responseRatePercentage: 98,
    disputeCount: 0,
    inspectionPassRatePercentage: 100,
  };

  const scoreBreakdown = calculateTrustScore(initialVerifications, initialReputation);
  const badges = evaluateBadges(initialVerifications, initialReputation, scoreBreakdown);

  const passport: TrustIdentity = {
    id: `passport_${userId}`,
    userId,
    fullName: defaults?.fullName ?? "Chief Stankings Properties",
    avatarUrl: "/images/logo.webp",
    email: defaults?.email ?? "stankings@yike.ng",
    phone: "+2348012345678",
    profileType: defaults?.profileType ?? "agency",
    identityStatus: "active",
    trustLevel: scoreBreakdown.trustLevel,
    trustScore: scoreBreakdown.overallScore,
    profileCompletenessPercentage: 95,
    memberSince: "2026",
    lastVerificationDate: "2026-07-25",
    verifications: initialVerifications,
    reputation: initialReputation,
    badges,
    scoreBreakdown,
  };

  identityStore.set(userId, passport);
  return passport;
}

/** Record new verification audit entry */
export async function recordVerification(
  userId: string,
  verificationType: VerificationType,
  status: "verified" | "pending" | "rejected",
  verifierNotes?: string
): Promise<TrustIdentity> {
  const passport = await getOrCreateTrustIdentity(userId);
  const now = new Date().toISOString();

  const record: VerificationRecord = {
    id: `v_${verificationType}_${Date.now()}`,
    userId,
    verificationType,
    status,
    verifiedAt: status === "verified" ? now : null,
    verifierNotes,
  };

  passport.verifications = passport.verifications.filter((v) => v.verificationType !== verificationType);
  passport.verifications.push(record);

  // Recalculate score and badges
  const oldScore = passport.trustScore;
  passport.scoreBreakdown = calculateTrustScore(passport.verifications, passport.reputation);
  passport.trustScore = passport.scoreBreakdown.overallScore;
  passport.trustLevel = passport.scoreBreakdown.trustLevel;
  passport.badges = evaluateBadges(passport.verifications, passport.reputation, passport.scoreBreakdown);
  passport.lastVerificationDate = now;

  if (oldScore !== passport.trustScore) {
    trackTransactionEvent("trust_score_changed", {
      userId,
      metadata: { oldScore, newScore: passport.trustScore },
    });
  }

  if (status === "verified") {
    trackTransactionEvent(verificationType === "business_cac" ? "business_verified" : "identity_verified", {
      userId,
      metadata: { verificationType },
    });
  }

  identityStore.set(userId, passport);
  return passport;
}

/** Generate transparent Trust Audit Report */
export async function generateTrustAuditReport(userId: string): Promise<TrustAuditReport> {
  const passport = await getOrCreateTrustIdentity(userId);

  return {
    userId: passport.userId,
    fullName: passport.fullName,
    profileType: passport.profileType,
    trustScore: passport.trustScore,
    trustLevel: passport.trustLevel,
    calculatedAt: passport.scoreBreakdown.calculatedAt,
    breakdown: passport.scoreBreakdown,
    activeBadgesCount: passport.badges.length,
    verifiedCredentialsCount: passport.verifications.filter((v) => v.status === "verified").length,
    recommendation:
      passport.trustScore >= 80
        ? "Highly trusted merchant with verified identity and excellent deal completion history."
        : "Standard seller posture. Complete physical inspection for maximum trust level.",
  };
}
