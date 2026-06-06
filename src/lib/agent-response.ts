import type { Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

export type AgentActivitySignals = {
  contactClicks?: number;
  recentLeads?: number;
  listingUpdatedWithinDays?: number;
};

/** Heuristic labels — no fake reply-time stats. */
export function getAgentResponseLabel(
  agent: Profile,
  signals?: AgentActivitySignals
): string {
  const verified = isVerifiedAgentProfile(agent);
  const leads = signals?.recentLeads ?? 0;
  const clicks = signals?.contactClicks ?? 0;
  const active = isAgentActiveOnYike(signals);

  if (active && leads >= 3) {
    return "Active on Yike — often replies within hours";
  }
  if (leads >= 8 || clicks >= 20) {
    return "Popular agent on Yike";
  }
  if (agent.trust_score >= 75) {
    return "Trusted agent — usually responds same day";
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

export function getAgentActiveStatus(
  signals?: AgentActivitySignals
): "active" | "popular" | "standard" {
  const leads = signals?.recentLeads ?? 0;
  const clicks = signals?.contactClicks ?? 0;
  if (isAgentActiveOnYike(signals) && leads >= 2) return "active";
  if (leads >= 8 || clicks >= 20) return "popular";
  return "standard";
}
