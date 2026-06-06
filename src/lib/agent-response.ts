import type { Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

/** Heuristic response label — no schema change; uses trust + contact signals. */
export function getAgentResponseLabel(
  agent: Profile,
  contactClicks?: number
): string {
  const verified = isVerifiedAgentProfile(agent);

  if (contactClicks && contactClicks >= 12) {
    return "Active on Yike — often replies within hours";
  }
  if (agent.trust_score >= 75) {
    return "Trusted agent — usually responds same day";
  }
  if (verified && contactClicks && contactClicks >= 3) {
    return "Verified — typical response same day";
  }
  if (verified) {
    return "Verified agent — contact via WhatsApp";
  }
  return "Contact via WhatsApp — agents usually respond same day";
}

export function getAgentActiveStatus(
  contactClicks?: number
): "active" | "responsive" | "standard" {
  if (contactClicks && contactClicks >= 12) return "active";
  if (contactClicks && contactClicks >= 4) return "responsive";
  return "standard";
}
