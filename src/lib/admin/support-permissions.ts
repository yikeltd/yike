import type { UserRole } from "@/types/database";

/** Lead PATCH actions support staff may perform on their assigned queue. */
export const SUPPORT_LEAD_ACTIONS = new Set([
  "archive",
  "unarchive",
  "quality",
  "mark_spam",
]);

/** Dispute actions support may take (no refunds / billing). */
export const SUPPORT_DISPUTE_ACTIONS = new Set([
  "open",
  "review",
  "reject",
  "resolve",
]);

export function isSupportRole(role: UserRole) {
  return role === "support";
}

export function supportCanUseLeadAction(role: UserRole, action: string) {
  if (!isSupportRole(role)) return true;
  return SUPPORT_LEAD_ACTIONS.has(action);
}

export function supportCanUseDisputeAction(role: UserRole, action: string) {
  if (!isSupportRole(role)) return true;
  return SUPPORT_DISPUTE_ACTIONS.has(action);
}

export function supportCanChangeAvailability(role: UserRole) {
  return !isSupportRole(role);
}

export function supportCanWriteProfileNotes(role: UserRole) {
  return !isSupportRole(role);
}

export function supportOwnsAssignment(
  role: UserRole,
  assigneeId: string | null | undefined,
  actorId: string
) {
  if (!isSupportRole(role)) return true;
  if (!assigneeId) return false;
  return assigneeId === actorId;
}
