export const VERIFIER_CODE_PREFIX = "FVR";
export const DEFAULT_VERIFIER_FEE = 5000;
export const EARNINGS_HOLD_DAYS = 7;

export type VerifierStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "paused"
  | "suspended"
  | "inactive"
  | "fraud_review";

export type VerificationRequestStatus =
  | "pending"
  | "awaiting_assignment"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "rejected"
  | "cancelled"
  | "fraud_review";

export {
  FIELD_VERIFIER_DISCLAIMER as LEGAL_DISCLAIMER,
  FIELD_VERIFIER_DISCLAIMER_SHORT,
} from "@/lib/copy/user-messages";

export function lagosYearMonth(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}
