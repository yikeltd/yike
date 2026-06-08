import type { ReviewJudgment } from "./score";
import type {
  ReviewQueueGroup,
  ReviewRiskLevel,
  ReviewSuggestedAction,
} from "./constants";

export function suggestReviewAction(judgment: ReviewJudgment): ReviewSuggestedAction {
  const { scores, riskLevel, naijaFlex, attention } = judgment;

  if (riskLevel === "severe" || scores.trustRisk >= 80) return "suspend";
  if (scores.trustRisk >= 65 && naijaFlex.abuseRisk >= 40) return "reject";

  if (attention.some((a) => /duplicate/i.test(a))) return "reject";
  if (attention.some((a) => /document|title/i.test(a))) return "ask_document_evidence";
  if (attention.some((a) => /photo/i.test(a))) return "ask_clearer_photos";
  if (attention.some((a) => /fee|agency/i.test(a))) return "ask_fee_breakdown";
  if (attention.some((a) => /location/i.test(a))) return "ask_location_correction";
  if (attention.some((a) => /price/i.test(a)) && !naijaFlex.isExplainableFlex) {
    return "ask_explain";
  }

  if (scores.overall >= 78 && riskLevel === "low") return "approve";
  if (scores.overall >= 65 && riskLevel !== "high") return "approve_rank_lower";
  if (naijaFlex.isExplainableFlex && scores.overall >= 60) return "request_update";
  if (scores.overall >= 50) return "request_update";

  return "ask_explain";
}

export function assignQueueGroup(
  judgment: ReviewJudgment,
  context?: { agentTrusted?: boolean }
): ReviewQueueGroup {
  const { scores, riskLevel, attention } = judgment;

  if (context?.agentTrusted && scores.overall >= 72 && riskLevel === "low") {
    return "trusted_agent_batch";
  }
  if (attention.some((a) => /duplicate|photo/i.test(a))) {
    return "duplicate_photo_issue";
  }
  if (attention.some((a) => /price/i.test(a))) return "pricing_anomaly";
  if (riskLevel === "high" || riskLevel === "severe") return "high_risk";
  if (judgment.naijaFlex.isExplainableFlex && scores.overall >= 65) {
    return "needs_explanation";
  }
  if (scores.overall >= 75 && riskLevel === "low") return "ready_to_approve";
  if (scores.overall >= 55) return "needs_small_update";
  if (judgment.naijaFlex.vagueSignals.length > 0) return "needs_explanation";
  return "needs_small_update";
}

export function riskLabel(level: ReviewRiskLevel): string {
  switch (level) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    case "severe":
      return "Severe";
  }
}
