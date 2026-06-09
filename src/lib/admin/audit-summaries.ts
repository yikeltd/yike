import { staffRoleLabel } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

type SummaryInput = {
  action: string;
  actorName?: string | null;
  actorRole: UserRole | string;
  targetType?: string | null;
  targetId?: string | null;
  targetUserName?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  supportViewContext?: boolean;
};

function actorLabel(input: SummaryInput): string {
  if (input.actorName?.trim()) return input.actorName.trim();
  return staffRoleLabel(input.actorRole as UserRole);
}

function targetLabel(input: SummaryInput): string {
  if (input.targetUserName?.trim()) return input.targetUserName.trim();
  const meta = input.metadata ?? {};
  if (typeof meta.title === "string" && meta.title.trim()) return meta.title.trim();
  if (typeof meta.listing_title === "string") return meta.listing_title;
  if (typeof meta.name === "string") return meta.name;
  if (typeof meta.city === "string" && meta.city) return `listing in ${meta.city}`;
  if (input.targetType && input.targetId) {
    return `${input.targetType} ${input.targetId.slice(0, 8)}`;
  }
  return "record";
}

const ACTION_TEMPLATES: Record<string, (a: SummaryInput) => string> = {
  "listing.approve": (i) => `${actorLabel(i)} approved listing ${targetLabel(i)}.`,
  "listing.reject": (i) => `${actorLabel(i)} rejected listing ${targetLabel(i)}.`,
  "listing.archive": (i) => `${actorLabel(i)} archived listing ${targetLabel(i)}.`,
  "listing.restore": (i) => `${actorLabel(i)} restored listing ${targetLabel(i)}.`,
  "listing.hide": (i) => `${actorLabel(i)} hid listing ${targetLabel(i)}.`,
  "listing.feature": (i) => `${actorLabel(i)} featured listing ${targetLabel(i)}.`,
  "listing.unfeature": (i) => `${actorLabel(i)} removed featured status from ${targetLabel(i)}.`,
  "listing.yike_verify": (i) => `${actorLabel(i)} updated Yike verification on ${targetLabel(i)}.`,
  "listing.moderate": (i) => `${actorLabel(i)} moderated listing ${targetLabel(i)}.`,
  "listing.review_bulk": (i) => {
    const count = i.metadata?.count ?? i.metadata?.listing_count;
    return `${actorLabel(i)} bulk-reviewed ${count ?? "multiple"} listings.`;
  },
  "agent.suspend": (i) => `${actorLabel(i)} suspended agent ${targetLabel(i)}.`,
  "agent.reinstate": (i) => `${actorLabel(i)} reinstated agent ${targetLabel(i)}.`,
  "agent.delete": (i) => `${actorLabel(i)} removed agent account ${targetLabel(i)}.`,
  "agent.on_hold": (i) => `${actorLabel(i)} placed agent ${targetLabel(i)} on hold.`,
  "agent.verification.approve": (i) =>
    `${actorLabel(i)} approved agent verification for ${targetLabel(i)}.`,
  "agent.verification.reject": (i) =>
    `${actorLabel(i)} rejected agent verification for ${targetLabel(i)}.`,
  "user.delete": (i) => `${actorLabel(i)} deleted user account ${targetLabel(i)}.`,
  "account.restore": (i) => `${actorLabel(i)} restored account ${targetLabel(i)}.`,
  "trust.verification.escalate": (i) =>
    `${actorLabel(i)} escalated trust review for ${targetLabel(i)}.`,
  "trust.verification.restore": (i) =>
    `${actorLabel(i)} restored trust access for ${targetLabel(i)}.`,
  "trust.review.resolve": (i) =>
    `${actorLabel(i)} resolved trust review for ${targetLabel(i)}.`,
  "trust.review.dismiss": (i) =>
    `${actorLabel(i)} dismissed trust review for ${targetLabel(i)}.`,
  "trust.verification.config.update": (i) =>
    `${actorLabel(i)} updated global verification settings.`,
  "trust.verification.permission.grant": (i) =>
    `${actorLabel(i)} granted verification control access to ${targetLabel(i)}.`,
  "trust.verification.permission.revoke": (i) =>
    `${actorLabel(i)} revoked verification control access from ${targetLabel(i)}.`,
  "trust.score.override": (i) =>
    `${actorLabel(i)} overrode trust score for ${targetLabel(i)}.`,
  "staff.create": (i) => `${actorLabel(i)} created staff account ${targetLabel(i)}.`,
  "staff.disable": (i) => `${actorLabel(i)} disabled staff account ${targetLabel(i)}.`,
  "staff.enable": (i) => `${actorLabel(i)} re-enabled staff account ${targetLabel(i)}.`,
  "staff.delete": (i) => `${actorLabel(i)} deleted staff account ${targetLabel(i)}.`,
  "staff.reset_password": (i) =>
    `${actorLabel(i)} reset password for staff ${targetLabel(i)}.`,
  "staff.onboarding.sent": (i) =>
    `${actorLabel(i)} sent staff onboarding to ${targetLabel(i)}.`,
  "staff.onboarding.resent": (i) =>
    `${actorLabel(i)} resent staff onboarding email to ${targetLabel(i)}.`,
  "staff.suspend": (i) => `${actorLabel(i)} suspended staff access for ${targetLabel(i)}.`,
  "staff.archive": (i) => `${actorLabel(i)} archived staff account ${targetLabel(i)}.`,
  "staff.reactivate": (i) => `${actorLabel(i)} reactivated staff account ${targetLabel(i)}.`,
  "staff.role.changed": (i) => {
    const from = i.metadata?.from_role ?? i.metadata?.previous_role;
    const to = i.metadata?.to_role ?? i.metadata?.new_role;
    if (from && to) {
      return `${actorLabel(i)} changed staff role from ${from} → ${to} for ${targetLabel(i)}.`;
    }
    return `${actorLabel(i)} changed staff role for ${targetLabel(i)}.`;
  },
  "staff.onboarding.deactivated": (i) =>
    `${actorLabel(i)} deactivated onboarding for ${targetLabel(i)}.`,
  "profile.avatar.upload": (i) => `${targetLabel(i)} updated profile photo.`,
  "profile.cover.upload": (i) => `${targetLabel(i)} uploaded a profile cover.`,
  "profile.cover.remove": (i) => `${targetLabel(i)} removed profile cover.`,
  "profile.cover.reposition": (i) => `${targetLabel(i)} repositioned profile cover.`,
  "admin.profile.avatar.remove": (i) =>
    `${actorLabel(i)} removed profile photo for ${targetLabel(i)}.`,
  "admin.profile.cover.remove": (i) =>
    `${actorLabel(i)} removed profile cover for ${targetLabel(i)}.`,
  "notification.sent": (i) => `${actorLabel(i)} sent notification campaign ${targetLabel(i)}.`,
  "notification.cancelled": (i) =>
    `${actorLabel(i)} cancelled notification campaign ${targetLabel(i)}.`,
  "hot_pick.create": (i) => `${actorLabel(i)} added hot pick ${targetLabel(i)}.`,
  "hot_pick.update": (i) => `${actorLabel(i)} updated hot pick ${targetLabel(i)}.`,
  "hot_pick.delete": (i) => `${actorLabel(i)} removed hot pick ${targetLabel(i)}.`,
  "hot_pick.reorder": (i) => `${actorLabel(i)} reordered hot picks.`,
  "site_banner.create": (i) => `${actorLabel(i)} created site banner ${targetLabel(i)}.`,
  "site_banner.update": (i) => `${actorLabel(i)} updated site banner ${targetLabel(i)}.`,
  "site_banner.delete": (i) => `${actorLabel(i)} archived site banner ${targetLabel(i)}.`,
  "site_banner.restore": (i) => `${actorLabel(i)} restored site banner ${targetLabel(i)}.`,
  "ad_placement.update": (i) => `${actorLabel(i)} updated ad placement ${targetLabel(i)}.`,
  "email.ad.update": (i) => `${actorLabel(i)} updated email sponsor ad.`,
  "ad_creative.upload": (i) => `${actorLabel(i)} uploaded ad creative.`,
  "verifier.payout.approve": (i) =>
    `${actorLabel(i)} approved verifier payout for ${targetLabel(i)}.`,
  "verifier.payout.paid": (i) =>
    `${actorLabel(i)} marked verifier payout paid for ${targetLabel(i)}.`,
  "ambassador.payout.approve": (i) =>
    `${actorLabel(i)} approved ambassador payout for ${targetLabel(i)}.`,
  "ambassador.payout.paid": (i) =>
    `${actorLabel(i)} marked ambassador payout paid for ${targetLabel(i)}.`,
  "ambassador.commission.record": (i) =>
    `${actorLabel(i)} updated ambassador commission for ${targetLabel(i)}.`,
  "deal_matching.commission.update": (i) =>
    `${actorLabel(i)} updated deal matching commission.`,
  "settings.update": (i) => `${actorLabel(i)} updated platform settings.`,
  "support_view.start": (i) =>
    `${actorLabel(i)} started read-only support view of ${targetLabel(i)}.`,
  "support_view.end": (i) =>
    `${actorLabel(i)} ended support view of ${targetLabel(i)}.`,
  "support_view.action": (i) =>
    `${actorLabel(i)} performed ${i.metadata?.inner_action ?? "action"} while viewing ${targetLabel(i)} account.`,
  "pin.verify": (i) => `${actorLabel(i)} verified admin PIN.`,
  "pin.failed": (i) => `${actorLabel(i)} failed admin PIN verification.`,
};

export function buildAuditSummary(input: SummaryInput): string {
  const template = ACTION_TEMPLATES[input.action];
  let summary = template
    ? template(input)
    : `${actorLabel(input)} performed ${input.action.replace(/\./g, " ")} on ${targetLabel(input)}.`;

  if (input.supportViewContext) {
    summary = summary.replace(/\.$/, " while viewing another account.");
  }

  if (input.reason?.trim()) {
    summary += ` Reason: ${input.reason.trim()}.`;
  }

  return summary;
}
