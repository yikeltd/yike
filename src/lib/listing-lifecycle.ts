import type { ListingPlan, Property, PropertyStatus } from "@/types/database";

export const LISTING_PLAN_DAYS: Record<ListingPlan, number> = {
  free: 14,
  premium_30: 30,
  premium_60: 60,
  admin_extended: 14,
};

export const LISTING_EXPIRED_MESSAGE =
  "This listing has expired. Reactivate it if it is still available.";

export const LISTING_REACTIVATED_MESSAGE = "Your listing is active again.";

export const ACCOUNT_REVIEW_BLOCKS_REACTIVATION =
  "Your account is under review. Please contact Yike support.";

export function isListingExpired(
  property: Pick<Property, "expires_at" | "status">
): boolean {
  if (property.status === "archived" || property.status === "rejected") {
    return false;
  }
  return new Date(property.expires_at) <= new Date();
}

export function isListingPubliclyActive(
  property: Pick<
    Property,
    "status" | "expires_at" | "availability_status"
  >
): boolean {
  if (property.status !== "approved") return false;
  if (isListingExpired(property)) return false;
  const avail = property.availability_status ?? "available";
  if (["rented", "sold", "unavailable", "hidden"].includes(avail)) return false;
  return true;
}

export function computeExpiresAt(
  plan: ListingPlan = "free",
  from: Date = new Date(),
  customDays?: number | null
): { expiresAt: string; durationDays: number } {
  const durationDays =
    plan === "admin_extended" && customDays
      ? customDays
      : LISTING_PLAN_DAYS[plan] ?? 14;
  const expiresAt = new Date(from.getTime() + durationDays * 86_400_000).toISOString();
  return { expiresAt, durationDays };
}

export type AgentListingAction =
  | "mark_rented"
  | "mark_sold"
  | "mark_unavailable"
  | "reactivate"
  | "archive";

export function statusAfterAgentAction(
  action: AgentListingAction,
  current: Pick<Property, "status">
): { status: PropertyStatus; availability_status: string; needsReview: boolean } {
  const now = new Date().toISOString();
  switch (action) {
    case "mark_rented":
      return {
        status: "rented",
        availability_status: "rented",
        needsReview: false,
      };
    case "mark_sold":
      return {
        status: "hidden",
        availability_status: "sold",
        needsReview: false,
      };
    case "mark_unavailable":
      return {
        status: "approved",
        availability_status: "unavailable",
        needsReview: false,
      };
    case "archive":
      return {
        status: "archived",
        availability_status: "hidden",
        needsReview: false,
      };
    case "reactivate":
      if (current.status === "rejected" || current.status === "flagged") {
        return {
          status: "pending",
          availability_status: "under_review",
          needsReview: true,
        };
      }
      return {
        status: "pending",
        availability_status: "available",
        needsReview: true,
      };
    default:
      return {
        status: current.status,
        availability_status: "available",
        needsReview: false,
      };
  }
}

export function canAgentReactivate(
  property: Pick<Property, "status">
): { ok: boolean; reason?: string } {
  if (property.status === "rejected") {
    return { ok: false, reason: "Rejected listings need admin approval to reactivate." };
  }
  if (property.status === "flagged") {
    return { ok: false, reason: "This listing is under admin review." };
  }
  return { ok: true };
}

export function maskBankAccount(account: string | null | undefined): string {
  const digits = String(account ?? "").replace(/\D/g, "");
  if (digits.length < 6) return "••••••";
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}
