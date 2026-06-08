export const PARTNER_CODE_PREFIX = "LVP";
export const LEGAL_REQUEST_PREFIX = "YLR";
export const DEFAULT_PARTNER_FEE = 15000;
export const EARNINGS_HOLD_DAYS = 7;

export {
  LEGAL_REVIEW_DISCLAIMER as LEGAL_DISCLAIMER,
  LEGAL_REVIEW_DISCLAIMER_SHORT,
} from "@/lib/copy/user-messages";

export type LegalPartnerStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "paused"
  | "suspended"
  | "inactive"
  | "fraud_review";

export type LegalReviewType =
  | "level_1_basic"
  | "level_2_survey"
  | "level_3_registry"
  | "level_4_opinion"
  | "level_5_advisory";

export const REVIEW_TYPE_OPTIONS: { id: LegalReviewType; label: string; phase: number }[] = [
  { id: "level_1_basic", label: "Level 1 — Basic document review", phase: 1 },
  { id: "level_2_survey", label: "Level 2 — Survey/document consistency", phase: 1 },
  { id: "level_3_registry", label: "Level 3 — Registry/title search", phase: 2 },
  { id: "level_4_opinion", label: "Level 4 — Extended legal opinion", phase: 2 },
  { id: "level_5_advisory", label: "Level 5 — Transaction advisory", phase: 2 },
];

export type RiskLevel = "low" | "moderate" | "high" | "unclear";

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
