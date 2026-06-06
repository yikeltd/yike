import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export type AuditAction =
  | "staff.create"
  | "staff.delete"
  | "staff.disable"
  | "staff.enable"
  | "staff.reset_password"
  | "staff.from_application"
  | "listing.delete"
  | "listing.approve"
  | "listing.reject"
  | "listing.feature"
  | "listing.boost"
  | "listing.update"
  | "listing.slug"
  | "listing.media"
  | "listing.reassign"
  | "agent.listing_limit"
  | "agent.approve"
  | "agent.suspend"
  | "agent.reinstate"
  | "agent.delete"
  | "review.approve"
  | "review.reject"
  | "review.hide"
  | "review.flag"
  | "review.delete"
  | "review.reply.approve"
  | "review.reply.reject"
  | "agent.verification.schedule_call"
  | "agent.verification.approve"
  | "agent.verification.failed_call"
  | "agent.verification.reschedule_call"
  | "settings.update"
  | "user.delete"
  | "data.export"
  | "pin.verify"
  | "pin.failed";

export type AuditLogEntry = {
  actor_id: string;
  actor_role: UserRole;
  action: AuditAction | string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
};

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase.from("audit_logs").insert({
    actor_id: entry.actor_id,
    actor_role: entry.actor_role,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    metadata: entry.metadata ?? {},
    ip_hash: entry.ip ? hashIp(entry.ip) : null,
  });
}
