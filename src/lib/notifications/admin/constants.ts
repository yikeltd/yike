export const NOTIFICATION_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "account", label: "Account" },
  { value: "listing", label: "Listing" },
  { value: "verification", label: "Verification" },
  { value: "lead", label: "Lead" },
  { value: "payment", label: "Payment" },
  { value: "warning", label: "Warning" },
  { value: "announcement", label: "Announcement" },
  { value: "system", label: "System" },
] as const;

export const NOTIFICATION_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const TARGET_TYPES = [
  { value: "selected_users", label: "Individual users", group: "individual" },
  { value: "selected_agents", label: "Individual agents", group: "individual" },
  { value: "selected_companies", label: "Individual companies", group: "individual" },
  { value: "all_users", label: "All users", group: "bulk" },
  { value: "all_agents", label: "All agents", group: "bulk" },
  { value: "all_companies", label: "All companies", group: "bulk" },
  { value: "verified_agents", label: "Verified agents", group: "bulk" },
  { value: "unverified_agents", label: "Unverified agents", group: "bulk" },
  { value: "verified_companies", label: "Verified companies", group: "bulk" },
  { value: "unverified_companies", label: "Unverified companies", group: "bulk" },
  { value: "suspended_users", label: "Suspended / on-hold accounts", group: "bulk" },
  { value: "expiring_listing_agents", label: "Agents with expiring listings", group: "bulk" },
  { value: "pending_verification_companies", label: "Companies pending verification", group: "bulk" },
] as const;

/** Legacy campaign target_type values stored before rename */
export const LEGACY_TARGET_ALIASES: Record<string, NotificationTargetType> = {
  user: "selected_users",
  agent: "selected_agents",
  company: "selected_companies",
  expiring_listings_agents: "expiring_listing_agents",
  pending_company_verification: "pending_verification_companies",
};

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["value"];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number]["value"];
export type NotificationTargetType = (typeof TARGET_TYPES)[number]["value"];

export const INDIVIDUAL_TARGET_TYPES = new Set<NotificationTargetType>([
  "selected_users",
  "selected_agents",
  "selected_companies",
]);

export const BULK_TARGET_TYPES = new Set<NotificationTargetType>([
  "all_users",
  "all_agents",
  "all_companies",
  "verified_agents",
  "unverified_agents",
  "verified_companies",
  "unverified_companies",
  "suspended_users",
  "expiring_listing_agents",
  "pending_verification_companies",
]);

export type RecipientSearchType = "users" | "agents" | "companies";

export function recipientSearchTypeForTarget(
  targetType: NotificationTargetType
): RecipientSearchType | null {
  if (targetType === "selected_users") return "users";
  if (targetType === "selected_agents") return "agents";
  if (targetType === "selected_companies") return "companies";
  return null;
}

export function normalizeTargetType(raw: string): NotificationTargetType | null {
  const aliased = LEGACY_TARGET_ALIASES[raw] ?? raw;
  return TARGET_TYPES.some((t) => t.value === aliased)
    ? (aliased as NotificationTargetType)
    : null;
}

export function targetTypeLabel(type: string): string {
  const normalized = normalizeTargetType(type);
  if (normalized) {
    return TARGET_TYPES.find((t) => t.value === normalized)?.label ?? type;
  }
  return type;
}

export const DEFAULT_NOTIFICATION_TIMEZONE = "Africa/Lagos";
