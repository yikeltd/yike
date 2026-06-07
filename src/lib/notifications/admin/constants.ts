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
  { value: "user", label: "Specific users", group: "individual" },
  { value: "agent", label: "Specific agents", group: "individual" },
  { value: "company", label: "Specific companies", group: "individual" },
  { value: "all_users", label: "All users", group: "bulk" },
  { value: "all_agents", label: "All agents", group: "bulk" },
  { value: "all_companies", label: "All companies", group: "bulk" },
  { value: "verified_agents", label: "Verified agents", group: "bulk" },
  { value: "unverified_agents", label: "Unverified agents", group: "bulk" },
  { value: "verified_companies", label: "Verified companies", group: "bulk" },
  { value: "unverified_companies", label: "Unverified companies", group: "bulk" },
  { value: "suspended_users", label: "Suspended / on-hold accounts", group: "bulk" },
  { value: "expiring_listings_agents", label: "Agents with expiring listings", group: "bulk" },
  { value: "pending_company_verification", label: "Companies pending verification", group: "bulk" },
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["value"];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number]["value"];
export type NotificationTargetType = (typeof TARGET_TYPES)[number]["value"];

export const BULK_TARGET_TYPES = new Set<NotificationTargetType>([
  "all_users",
  "all_agents",
  "all_companies",
  "verified_agents",
  "unverified_agents",
  "verified_companies",
  "unverified_companies",
  "suspended_users",
  "expiring_listings_agents",
  "pending_company_verification",
]);

export const INDIVIDUAL_TARGET_TYPES = new Set<NotificationTargetType>([
  "user",
  "agent",
  "company",
]);

export function targetTypeLabel(type: string): string {
  return TARGET_TYPES.find((t) => t.value === type)?.label ?? type;
}
