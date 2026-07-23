/**
 * Future KYC / NIN readiness — provider-agnostic hooks.
 *
 * Identity & Seller Verification v1 uses manual admin review only.
 * Automated NIN / third-party KYC must plug in here without new accounts
 * or breaking seller_launch statuses.
 */

export type VerificationMethodKind =
  | "email_otp"
  | "phone_sms_otp"
  | "phone_whatsapp_otp"
  | "manual_admin_review"
  | "nin_lookup"
  | "government_id_upload"
  | "selfie_liveness"
  | "cac_business";

export type VerificationMethodStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "skipped";

/**
 * Extension point for a future `verification_methods` table or JSON map
 * on profiles. v1 stores signals on profiles + agent_verifications instead.
 */
export type VerificationMethodRecord = {
  kind: VerificationMethodKind;
  status: VerificationMethodStatus;
  provider?: string | null;
  reference?: string | null;
  verified_at?: string | null;
  metadata?: Record<string, unknown>;
};

/** Hook: map provider result into profile patches without changing account id. */
export type ApplyKycResultInput = {
  userId: string;
  method: VerificationMethodKind;
  provider: string;
  ok: boolean;
  reference?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Planned profile columns / JSON keys for KYC upgrade (add via migration later):
 * - profiles.kyc_level: 'none' | 'basic' | 'nin' | 'business'
 * - profiles.nin_verified_at / nin_provider / nin_reference (encrypted NIN stays on agent_verifications)
 * - optional verification_methods jsonb[] for multi-provider history
 *
 * Do NOT create parallel user accounts for KYC upgrades.
 */
export const KYC_READINESS_HOOKS = {
  /** After automated NIN succeeds — set nin_verified on agent_verifications + optionally accelerate manual queue. */
  onNinProviderSuccess: "lib/seller-trust/kyc-readiness.ts#ApplyKycResultInput",
  /** Admin can still Approve/Reject independently of provider result. */
  adminOverride: "api/admin/agents/verification",
  /** Seller launch status remains derived; KYC upgrades only add signals. */
  statusDerivation: "lib/seller-trust/status.ts#deriveSellerLaunchStatus",
} as const;

export function plannedKycLevelFromMethods(
  methods: VerificationMethodRecord[]
): "none" | "basic" | "nin" | "business" {
  const verified = new Set(
    methods.filter((m) => m.status === "verified").map((m) => m.kind)
  );
  if (verified.has("cac_business")) return "business";
  if (verified.has("nin_lookup")) return "nin";
  if (
    verified.has("email_otp") &&
    (verified.has("phone_sms_otp") || verified.has("phone_whatsapp_otp"))
  ) {
    return "basic";
  }
  return "none";
}
