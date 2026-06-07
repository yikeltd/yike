import type { TrustLevel } from "./constants";

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value * 100) / 100));
}

export function trustLevelFromScores(
  trustScore: number,
  riskScore: number,
  confidenceScore: number
): TrustLevel {
  if (riskScore >= 75 || trustScore <= 20) return "critical_risk";
  if (riskScore >= 55 || trustScore <= 35) return "high_risk";
  if (riskScore >= 35 || trustScore <= 45) return "elevated_risk";
  if (trustScore >= 88 && confidenceScore >= 70 && riskScore <= 15) return "highly_trusted";
  if (trustScore >= 95 && confidenceScore >= 85 && riskScore <= 10) return "elite";
  if (trustScore >= 72 && riskScore <= 25) return "trusted";
  return "neutral";
}

export function confidenceFromEventCount(eventCount: number, entityAgeDays?: number): number {
  let confidence = 10;
  if (eventCount >= 3) confidence += 10;
  if (eventCount >= 8) confidence += 15;
  if (eventCount >= 20) confidence += 20;
  if (eventCount >= 50) confidence += 25;
  if (entityAgeDays != null) {
    if (entityAgeDays >= 30) confidence += 5;
    if (entityAgeDays >= 90) confidence += 10;
    if (entityAgeDays >= 180) confidence += 10;
  }
  return clampScore(confidence, 0, 95);
}

/** Future decay prep — inactive entities lose confidence slowly, not trust immediately */
export function applyInactivityDecay(
  confidenceScore: number,
  inactiveDays: number
): number {
  if (inactiveDays <= 30) return confidenceScore;
  const decay = Math.min(25, Math.floor((inactiveDays - 30) / 14) * 3);
  return clampScore(confidenceScore - decay, 5, 95);
}
