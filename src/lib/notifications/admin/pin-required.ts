import type { NotificationCategory, NotificationPriority, NotificationTargetType } from "@/lib/notifications/admin/constants";
import { BULK_TARGET_TYPES } from "@/lib/notifications/admin/constants";

const BULK_PIN_TARGETS = new Set<NotificationTargetType>([
  "all_users",
  "all_agents",
  "all_companies",
]);

export function requiresAdminPinForSend(input: {
  targetType: NotificationTargetType;
  priority: NotificationPriority;
  category: NotificationCategory;
}): boolean {
  if (BULK_PIN_TARGETS.has(input.targetType)) return true;
  if (input.targetType === "suspended_users") return true;
  if (input.priority === "urgent") return true;
  if (input.category === "warning") return true;
  return false;
}
