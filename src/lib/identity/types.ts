/**
 * Identity Platform & Reputation Engine (Yike Passport) — Types & Interfaces (Phase 1.3)
 *
 * Governs canonical Trust Identity, Computed Trust Score, Reputation Metrics, and Badges.
 */

export type ProfileType = "individual" | "business" | "developer" | "agency" | "verifier" | "legal_partner";

export type IdentityStatus = "active" | "under_review" | "suspended" | "flagged";

export type TrustLevel = "bronze" | "silver" | "gold" | "platinum";

export type VerificationType =
  | "phone"
  | "email"
  | "identity_nin"
  | "business_cac"
  | "address_verification"
  | "live_walkthrough"
  | "inspection_participation";

export type VerificationRecord = {
  id: string;
  userId: string;
  verificationType: VerificationType;
  status: "verified" | "pending" | "rejected" | "expired";
  verifiedAt?: string | null;
  expiresAt?: string | null;
  verifierNotes?: string;
};

export type ReputationMetrics = {
  completedDeals: number;
  cancelledDeals: number;
  buyerReviewsCount: number;
  sellerReviewsCount: number;
  averageRating: number; // 0.0 to 5.0
  averageResponseTimeMinutes: number;
  responseRatePercentage: number;
  disputeCount: number;
  inspectionPassRatePercentage: number;
};

export type BadgeId =
  | "verified_identity"
  | "verified_business"
  | "fast_responder"
  | "trusted_seller"
  | "trusted_buyer"
  | "inspection_ready"
  | "top_agent"
  | "top_dealer"
  | "premium_partner";

export type TrustBadge = {
  id: BadgeId;
  label: string;
  description: string;
  iconName: string;
  style: "emerald" | "gold" | "blue" | "navy" | "purple";
  awardedAt: string;
};

export type TrustScoreSignal = {
  category: "identity" | "business" | "activity" | "responsiveness" | "reviews" | "disputes";
  label: string;
  pointsEarned: number;
  maxPoints: number;
  description: string;
};

export type TrustScoreBreakdown = {
  overallScore: number; // 0 to 100
  trustLevel: TrustLevel;
  signals: TrustScoreSignal[];
  calculatedAt: string;
};

export type TrustIdentity = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  phone?: string;
  profileType: ProfileType;
  identityStatus: IdentityStatus;
  trustLevel: TrustLevel;
  trustScore: number;
  profileCompletenessPercentage: number;
  memberSince: string;
  lastVerificationDate?: string | null;
  verifications: VerificationRecord[];
  reputation: ReputationMetrics;
  badges: TrustBadge[];
  scoreBreakdown: TrustScoreBreakdown;
};

export type TrustAuditReport = {
  userId: string;
  fullName: string;
  profileType: ProfileType;
  trustScore: number;
  trustLevel: TrustLevel;
  calculatedAt: string;
  breakdown: TrustScoreBreakdown;
  activeBadgesCount: number;
  verifiedCredentialsCount: number;
  recommendation: string;
};
