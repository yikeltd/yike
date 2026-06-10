import { createHash } from "crypto";
import { buildAuditSummary } from "@/lib/admin/audit-summaries";
import { getAuditRiskLevel } from "@/lib/admin/audit-risk";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuditAction =
  | "staff.create"
  | "staff.assignment.grant"
  | "staff.assignment.revoke"
  | "staff.delete"
  | "staff.disable"
  | "staff.enable"
  | "staff.reset_password"
  | "staff.from_application"
  | "staff.onboarding.sent"
  | "staff.onboarding.resent"
  | "staff.credentials.generated"
  | "staff.suspend"
  | "staff.archive"
  | "staff.reactivate"
  | "staff.role.changed"
  | "staff.onboarding.deactivated"
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
  | "listing.restore"
  | "company.verification.submit"
  | "company.verification.approve"
  | "company.verification.reject"
  | "agent.listing_limit"
  | "agent.account_type"
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
  | "agent.verification.reject"
  | "settings.update"
  | "user.delete"
  | "account.restore"
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
  | "listing.value_drivers.update"
  | "listing.value_drivers.approve"
  | "listing.value_drivers.reject"
  | "listing.value_drivers.evidence"
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
  | "listing.review_action"
  | "listing.review_bulk"
  | "listing.review_request"
  | "trust.recalculate"
  | "trust.score.override"
  | "trust.score.event"
  | "home_services.provider.moderate"
  | "home_services.provider.status"
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
  | "ambassador.profile.updated"
  | "verifier.application.submit"
  | "verifier.approve"
  | "verifier.reject"
  | "verifier.suspend"
  | "verifier.bank.changed"
  | "verifier.bank.approved"
  | "verifier.assignment.assign"
  | "verifier.report.submit"
  | "verifier.report.approve"
  | "verifier.report.reject"
  | "verifier.payout.approve"
  | "verifier.payout.paid"
  | "verification.request.submit"
  | "verification.buyer.contacted"
  | "verification.buyer.delivered"
  | "verification.buyer.reject"
  | "legal_partner.application.submit"
  | "legal_partner.approve"
  | "legal_partner.reject"
  | "legal_partner.suspend"
  | "legal_partner.bank.changed"
  | "legal_partner.bank.approved"
  | "legal_partner.assignment.assign"
  | "legal_partner.report.submit"
  | "legal_partner.report.approve"
  | "legal_partner.report.reject"
  | "legal_partner.payout.approve"
  | "legal_partner.payout.paid"
  | "legal_verification.request.submit"
  | "legal_verification.buyer.contacted"
  | "legal_verification.buyer.delivered"
  | "legal_verification.fraud_review"
  | "trust.escalation.open"
  | "trust.fraud_review"
  | "trust.blacklist.add"
  | "trust.watchlist.add"
  | "trust.dispute.create"
  | "trust.risk.recalculate"
  | "trust.reinspection.request"
  | "deal_matching.request.create"
  | "deal_matching.request.update"
  | "deal_matching.outreach.send"
  | "deal_matching.status.update"
  | "deal_matching.commission.update"
  | "deal_matching.permission.grant"
  | "deal_matching.permission.revoke"
  | "trust.verification.config.update"
  | "trust.verification.escalate"
  | "trust.verification.restore"
  | "trust.verification.override"
  | "trust.verification.permission.grant"
  | "trust.verification.permission.revoke"
  | "trust.review.resolve"
  | "trust.review.dismiss"
  | "trust.bank.submit"
  | "trust.bank.verify"
  | "hot_pick.create"
  | "hot_pick.update"
  | "hot_pick.delete"
  | "hot_pick.reorder"
  | "site_banner.create"
  | "site_banner.update"
  | "site_banner.delete"
  | "site_banner.restore"
  | "ad_placement.update"
  | "email.ad.update"
  | "ad_creative.upload"
  | "support_view.start"
  | "support_view.end"
  | "support_view.action"
  | "career.follow_up.generated"
  | "career.follow_up.sent"
  | "career.follow_up.submitted"
  | "career.application.status"
  | "career.follow_up.review"
  | "profile.avatar.upload"
  | "profile.cover.upload"
  | "profile.cover.remove"
  | "profile.cover.reposition"
  | "admin.profile.avatar.remove"
  | "admin.profile.cover.remove";

export type AuditLogEntry = {
  actor_id: string;
  actor_role: UserRole;
  actor_name?: string | null;
  action: AuditAction | string;
  target_type?: string;
  target_id?: string;
  target_user_id?: string | null;
  target_user_name?: string | null;
  reason?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string;
  user_agent_hash?: string;
  route?: string;
  support_view_context?: boolean;
};

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

async function resolveActorName(actorId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: staff } = await admin
    .from("staff_profiles")
    .select("full_name")
    .eq("id", actorId)
    .maybeSingle();

  if (staff?.full_name) return staff.full_name;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username")
    .eq("id", actorId)
    .maybeSingle();

  return profile?.full_name ?? profile?.username ?? null;
}

function buildRow(entry: AuditLogEntry, actorName: string | null) {
  const summary =
    entry.summary ??
    buildAuditSummary({
      action: entry.action,
      actorName: entry.actor_name ?? actorName,
      actorRole: entry.actor_role,
      targetType: entry.target_type,
      targetId: entry.target_id,
      targetUserName: entry.target_user_name,
      reason: entry.reason ?? (entry.metadata?.reason as string | undefined),
      metadata: entry.metadata,
      supportViewContext: entry.support_view_context,
    });

  const reason =
    entry.reason ??
    (typeof entry.metadata?.reason === "string" ? entry.metadata.reason : null);

  return {
    actor_id: entry.actor_id,
    actor_name: entry.actor_name ?? actorName,
    actor_role: entry.actor_role,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    target_user_id: entry.target_user_id ?? null,
    target_user_name: entry.target_user_name ?? null,
    reason,
    summary,
    metadata: entry.metadata ?? {},
    ip_hash: entry.ip ? hashIp(entry.ip) : null,
    user_agent_hash: entry.user_agent_hash ?? null,
    route: entry.route ?? null,
    risk_level: getAuditRiskLevel(entry.action),
  };
}

async function insertAuditRow(row: ReturnType<typeof buildRow>): Promise<void> {
  const session = await createClient();
  if (session) {
    const { error } = await session.from("audit_logs").insert(row);
    if (!error) return;
  }

  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("audit_logs").insert(row);
}

/** Fire-and-forget audit insert — does not block the caller. */
export function writeAuditLogAsync(entry: AuditLogEntry): void {
  void (async () => {
    const actorName = entry.actor_name ?? (await resolveActorName(entry.actor_id));
    const row = buildRow(entry, actorName);
    await insertAuditRow(row);
  })();
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const actorName = entry.actor_name ?? (await resolveActorName(entry.actor_id));
  const row = buildRow(entry, actorName);
  await insertAuditRow(row);
}
