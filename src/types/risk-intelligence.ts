export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskAssessment = {
  id: string;
  targetId: string;
  targetType: "escrow" | "listing" | "user";
  targetTitle: string;
  riskScore: number;
  riskLevel: RiskLevel;
  anomalyFlags: string[];
  recommendedAction: string;
  timestamp: string;
};

export type RiskRule = {
  id: string;
  name: string;
  condition: string;
  threshold: string;
  action: "FREEZE_ESCROW_CUSTODY" | "FLAG_MODERATION" | "REQUIRE_FIELD_VERIFIER" | "REQUIRE_2FA";
  status: "active" | "disabled";
  triggeredToday: number;
};

export type RiskModelPerformance = {
  accuracyPercentage: string;
  falsePositiveRate: string;
  fraudVolumeSaved: string;
  totalScanned: number;
  modelVersion: string;
};
