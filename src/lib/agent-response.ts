import type { Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

export type AgentActivitySignals = {
  contactClicks?: number;
  recentLeads?: number;
  listingUpdatedWithinDays?: number;
};

/** Heuristic labels — no fake reply-time stats. */
export function getAgentMicroLabel(
  agent: Profile,
  signals?: AgentActivitySignals
): string | null {
  if (isRecentlyActiveAgent(agent, signals)) {
    return "Recently Active";
  }
  if (isResponsiveAgent(agent)) {
    return "Usually Responds Quickly";
  }
  return null;
}

export function isRecentlyActiveAgent(
  agent: Profile,
  signals?: AgentActivitySignals
): boolean {
  if (isAgentActiveOnYike(signals)) return true;
  if (agent.last_activity_at) {
    const days =
      (Date.now() - new Date(agent.last_activity_at).getTime()) / 86_400_000;
    if (days <= 7) return true;
  }
  return false;
}

export function getAgentResponseLabel(
  agent: Profile,
  signals?: AgentActivitySignals
): string {
  const verified = isVerifiedAgentProfile(agent);
  const leads = signals?.recentLeads ?? 0;
  const clicks = signals?.contactClicks ?? 0;
  const active = isRecentlyActiveAgent(agent, signals);

  if (active && leads >= 3) {
    return "Recently active — often replies within hours";
  }
  if (leads >= 8 || clicks >= 20) {
    return "Popular agent on Yike";
  }
  if (isResponsiveAgent(agent)) {
    return "Usually responds quickly";
  }
  if (verified && (leads >= 1 || clicks >= 3)) {
    return "Verified — typical response same day";
  }
  if (verified) {
    return "Verified agent — contact via WhatsApp";
  }
  return "Contact via WhatsApp — agents usually respond same day";
}

export function isAgentActiveOnYike(signals?: AgentActivitySignals): boolean {
  if (!signals) return false;
  if ((signals.recentLeads ?? 0) >= 1) return true;
  if ((signals.listingUpdatedWithinDays ?? 99) <= 7) return true;
  return false;
}

export function isResponsiveAgent(agent: Profile): boolean {
  if (agent.is_responsive) return true;
  if ((agent.response_rate ?? 0) >= 0.6) return true;
  if (
    agent.avg_response_time_minutes != null &&
    agent.avg_response_time_minutes <= 360
  ) {
    return (agent.inquiry_count ?? 0) >= 2;
  }
  return false;
}

export function getAgentActiveStatus(
  signals?: AgentActivitySignals
): "active" | "popular" | "standard" {
  const leads = signals?.recentLeads ?? 0;
  const clicks = signals?.contactClicks ?? 0;
  if (isAgentActiveOnYike(signals) && leads >= 2) return "active";
  if (leads >= 8 || clicks >= 20) return "popular";
  return "standard";
}
