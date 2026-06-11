export const BUSINESS_VERIFICATION_FEE_NGN = 4_999;

export const SELLER_VERIFICATION_COPY = {
  verifiedLabel: "Verified",
  businessLabel: "Business Verified",
  explainerTitle: "What this means",
  explainerBody:
    "Yike has reviewed information submitted by this seller. This does not constitute legal ownership verification.",
  businessCta: "Become Business Verified",
  businessFeeLabel: "₦4,999 one-time review fee",
} as const;

export const SELLER_VERIFICATION_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
] as const;
