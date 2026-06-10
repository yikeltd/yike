import { isStaffRole } from "@/lib/admin/roles";
import type { AccountType, UserRole } from "@/types/database";

export type SessionAccountClass = "consumer" | "trust" | "staff";

export type SessionPolicy = {
  accountClass: SessionAccountClass;
  /** Soft lock after this idle period; null = never idle-lock */
  idleLockMs: number | null;
  /** Require full password login after this inactivity */
  fullLoginExpiryMs: number;
  pinUnlockEnabled: boolean;
  pinForSensitiveActions: boolean;
  otpForSensitiveActions: readonly string[];
  accountTypeLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const TRUST_ACCOUNT_TYPES = new Set<AccountType>([
  "city_ambassador",
  "field_verifier",
  "legal_partner",
]);

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: "Individual",
  agent: "Agent",
  agency: "Agency",
  developer: "Developer",
  landlord: "Landlord",
  city_ambassador: "City Ambassador",
  field_verifier: "Field Verifier",
  legal_partner: "Legal Partner",
  service_provider: "Service Provider",
};

const CONSUMER_SENSITIVE_OTP = [
  "change_email",
  "change_password",
  "change_payout_bank",
] as const;

const TRUST_SENSITIVE_OTP = [
  "change_email",
  "change_password",
  "change_payout_bank",
  "change_identity",
] as const;

export function getSessionPolicy(
  accountType: AccountType | null | undefined,
  role: UserRole
): SessionPolicy {
  if (isStaffRole(role)) {
    return {
      accountClass: "staff",
      idleLockMs: 20 * MINUTE_MS,
      fullLoginExpiryMs: 3 * DAY_MS,
      pinUnlockEnabled: true,
      pinForSensitiveActions: true,
      otpForSensitiveActions: TRUST_SENSITIVE_OTP,
      accountTypeLabel: "Staff",
    };
  }

  const type = accountType ?? "individual";

  if (TRUST_ACCOUNT_TYPES.has(type)) {
    return {
      accountClass: "trust",
      idleLockMs: 30 * MINUTE_MS,
      fullLoginExpiryMs: 7 * DAY_MS,
      pinUnlockEnabled: true,
      pinForSensitiveActions: true,
      otpForSensitiveActions: TRUST_SENSITIVE_OTP,
      accountTypeLabel: ACCOUNT_TYPE_LABELS[type],
    };
  }

  return {
    accountClass: "consumer",
    idleLockMs: null,
    fullLoginExpiryMs: 10 * DAY_MS,
    pinUnlockEnabled: true,
    pinForSensitiveActions: true,
    otpForSensitiveActions: CONSUMER_SENSITIVE_OTP,
    accountTypeLabel:
      type === "agency" || type === "developer" || type === "landlord"
        ? ACCOUNT_TYPE_LABELS[type]
        : role === "agent_verified" || role === "agent_unverified"
          ? "Agent"
          : ACCOUNT_TYPE_LABELS.individual,
  };
}

export function sensitiveActionRequiresOtp(
  policy: SessionPolicy,
  action: string
): boolean {
  return policy.otpForSensitiveActions.includes(action);
}
