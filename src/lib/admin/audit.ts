import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
  | "listing.unfeature"
  | "listing.yike_verify"
  | "listing.premium_deal"
  | "listing.boost"
  | "listing.update"
  | "listing.slug"
  | "listing.media"
  | "listing.reassign"
  | "listing.rented"
  | "listing.sold"
  | "listing.unavailable"
  | "listing.reactivate"
  | "listing.archive"
  | "company.verification.submit"
  | "company.verification.approve"
  | "company.verification.reject"
  | "agent.listing_limit"
  | "agent.approve"
  | "agent.suspend"
  | "agent.reinstate"
  | "agent.delete"
  | "agent.on_hold"
  | "agent.verification_request"
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
  | "pin.failed"
  | "pin.admin_setup"
  | "pin.admin_change"
  | "pin.admin_reset"
  | "pin.login_reset"
  | "lead.archive"
  | "lead.quality"
  | "lead.assign"
  | "lead.note"
  | "agent.availability"
  | "listing.availability"
  | "agent.note"
  | "support.quick_reply"
  | "agent.routing"
  | "agent.routing.enable_direct"
  | "agent.routing.disable_direct"
  | "agent.billing_mode"
  | "agent.lead_price"
  | "agent.wallet_adjustment"
  | "lead.charge_waived"
  | "lead.charge_deducted"
  | "lead.refund"
  | "lead.routing_decision"
  | "lead.dispute.opened"
  | "lead.dispute.review"
  | "lead.dispute.resolved"
  | "listing.price_confirmed"
  | "listing.price_admin_approved"
  | "listing.price_edit_requested"
  | "listing.price_ignored"
  | "market.recalculated"
  | "luxury_zone.updated"
  | "notification.draft_created"
  | "notification.scheduled"
  | "notification.updated"
  | "notification.sent"
  | "notification.cancelled"
  | "notification.scheduled_processed"
  | "user.profile_repair"
  | "user.profile_repair_bulk"
  | "lead.deal_status"
  | "inspection.create"
  | "inspection.status"
  | "inspection.assign"
  | "inspection.payment"
  | "listing.flag"
  | "listing.hide"
  | "listing.moderate"
  | "trust.recalculate"
  | "duplicate.scan"
  | "lead.respond"
  | "lead.handoff_copied"
  | "lead.handoff_shared"
  | "lead.concierge.spam"
  | "lead.concierge.cancel"
  | "ambassador.application.submit"
  | "ambassador.approve"
  | "ambassador.reject"
  | "ambassador.pause"
  | "ambassador.disable"
  | "ambassador.slot.update"
  | "ambassador.commission.hide"
  | "ambassador.commission.reverse"
  | "ambassador.commission.record"
  | "ambassador.payout.approve"
  | "ambassador.payout.paid"
  | "ambassador.attribution.override"
  | "ambassador.bank.changed"
  | "ambassador.bank.approved"
  | "ambassador.payout.held"
  | "ambassador.payout.rejected"
  | "ambassador.profile.updated";

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
  const row = {
    actor_id: entry.actor_id,
    actor_role: entry.actor_role,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    metadata: entry.metadata ?? {},
    ip_hash: entry.ip ? hashIp(entry.ip) : null,
  };

  const session = await createClient();
  if (session) {
    const { error } = await session.from("audit_logs").insert(row);
    if (!error) return;
  }

  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("audit_logs").insert(row);
}
