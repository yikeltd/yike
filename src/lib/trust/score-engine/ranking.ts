import type { Property } from "@/types/database";

/**
 * Subtle internal ranking nudge from cached trust signals.
 * Never expose scores publicly — uses property.internal_* fields only.
 */
export function internalTrustRankAdjustment(
  property: Pick<
    Property,
    "internal_trust_score" | "internal_risk_score" | "fraud_risk_score"
  >
): number {
  let delta = 0;

  const trust = property.internal_trust_score;
  const risk = property.internal_risk_score ?? property.fraud_risk_score ?? 0;

  if (trust != null) {
    if (trust >= 75) delta += 120;
    else if (trust >= 65) delta += 60;
    else if (trust <= 40) delta -= 200;
    else if (trust <= 50) delta -= 80;
  }

  if (risk >= 70) delta -= 400;
  else if (risk >= 50) delta -= 200;
  else if (risk >= 35) delta -= 80;

  return delta;
}

/** Verifier assignment priority from internal trust score row */
export function verifierAssignmentTrustBoost(
  trustScore: number,
  riskScore: number,
  confidenceScore: number
): number {
  let boost = 0;
  boost += Math.min(30, (trustScore - 50) * 0.6);
  boost -= Math.min(40, riskScore * 0.5);
  boost += Math.min(15, confidenceScore * 0.15);
  return Math.round(boost);
}
