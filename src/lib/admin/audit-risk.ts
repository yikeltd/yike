import type { AuditAction } from "@/lib/admin/audit";

export type AuditRiskLevel = "low" | "medium" | "high" | "critical";

const CRITICAL_ACTIONS = new Set<string>([
  "user.delete",
  "agent.delete",
  "staff.delete",
  "listing.delete",
  "trust.blacklist.add",
  "trust.verification.override",
  "pin.admin_reset",
  "staff.reset_password",
]);

const HIGH_RISK_ACTIONS = new Set<string>([
  "agent.suspend",
  "trust.verification.escalate",
  "trust.review.resolve",
  "trust.score.override",
  "verifier.suspend",
  "legal_partner.suspend",
  "ambassador.disable",
  "ambassador.payout.approve",
  "ambassador.payout.paid",
  "verifier.payout.approve",
  "verifier.payout.paid",
  "legal_partner.payout.approve",
  "legal_partner.payout.paid",
  "ambassador.commission.record",
  "ambassador.commission.reverse",
  "deal_matching.commission.update",
  "trust.verification.permission.grant",
  "trust.verification.permission.revoke",
  "deal_matching.permission.grant",
  "deal_matching.permission.revoke",
  "staff.create",
  "staff.disable",
  "notification.sent",
  "listing.archive",
  "site_banner.delete",
  "hot_pick.delete",
  "support_view.action",
  "account.restore",
  "listing.restore",
]);

const MEDIUM_RISK_ACTIONS = new Set<string>([
  "listing.reject",
  "listing.hide",
  "listing.moderate",
  "agent.reinstate",
  "trust.verification.restore",
  "trust.review.dismiss",
  "company.verification.reject",
  "agent.verification.reject",
  "verification.buyer.reject",
  "settings.update",
  "staff.enable",
  "notification.scheduled",
  "hot_pick.update",
  "site_banner.update",
  "ad_placement.update",
  "email.ad.update",
  "listing.review_bulk",
  "trust.verification.config.update",
]);

export function getAuditRiskLevel(action: AuditAction | string): AuditRiskLevel {
  if (CRITICAL_ACTIONS.has(action)) return "critical";
  if (HIGH_RISK_ACTIONS.has(action)) return "high";
  if (MEDIUM_RISK_ACTIONS.has(action)) return "medium";
  return "low";
}

export function isHighRiskAction(action: string): boolean {
  const level = getAuditRiskLevel(action);
  return level === "high" || level === "critical";
}

export const RISK_LEVEL_LABELS: Record<AuditRiskLevel, string> = {
  low: "Routine",
  medium: "Moderation",
  high: "High risk",
  critical: "Critical",
};
