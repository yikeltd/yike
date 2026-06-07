import type { NotificationCategory, NotificationPriority, NotificationTargetType } from "@/lib/notifications/admin/constants";
import { BULK_TARGET_TYPES } from "@/lib/notifications/admin/constants";

export function requiresAdminPinForSend(input: {
  targetType: NotificationTargetType;
  priority: NotificationPriority;
  category: NotificationCategory;
}): boolean {
  if (BULK_TARGET_TYPES.has(input.targetType)) return true;
  if (input.priority === "urgent") return true;
  if (input.category === "warning") return true;
  return false;
}
