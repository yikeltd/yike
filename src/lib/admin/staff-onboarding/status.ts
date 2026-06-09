export type StaffLifecycleStatus =
  | "onboarding_pending"
  | "invited"
  | "onboarding_sent"
  | "first_login_pending"
  | "active"
  | "suspended"
  | "archived";

export const STAFF_LIFECYCLE_LABELS: Record<StaffLifecycleStatus, string> = {
  onboarding_pending: "Onboarding pending",
  invited: "Invited",
  onboarding_sent: "Onboarding sent",
  first_login_pending: "Awaiting first login",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
};

export function isStaffAccessBlocked(status: string): boolean {
  return status === "suspended" || status === "archived";
}

export function statusAfterOnboardingSend(requirePasswordReset: boolean): StaffLifecycleStatus {
  return requirePasswordReset ? "first_login_pending" : "onboarding_sent";
}

export function statusAfterFirstLogin(
  requirePasswordReset: boolean,
  passwordResetCompleted: boolean
): StaffLifecycleStatus {
  if (requirePasswordReset && !passwordResetCompleted) return "first_login_pending";
  return "active";
}
