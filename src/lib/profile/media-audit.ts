import { writeAuditLogAsync, type AuditLogEntry } from "@/lib/admin/audit";
import type { UserRole } from "@/types/database";

export type ProfileMediaAuditAction =
  | "profile.avatar.upload"
  | "profile.cover.upload"
  | "profile.cover.remove"
  | "profile.cover.reposition"
  | "admin.profile.avatar.remove"
  | "admin.profile.cover.remove";

export function logProfileMediaEvent(
  entry: Omit<AuditLogEntry, "action"> & { action: ProfileMediaAuditAction }
): void {
  writeAuditLogAsync({
    target_type: "profile",
    ...entry,
  });
}

export function logUserProfileMedia(
  userId: string,
  role: UserRole,
  action: ProfileMediaAuditAction,
  metadata?: Record<string, unknown>
): void {
  logProfileMediaEvent({
    actor_id: userId,
    actor_role: role,
    action,
    target_id: userId,
    target_user_id: userId,
    metadata,
  });
}
