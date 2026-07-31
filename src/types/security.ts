export type SecurityCheckStatus = "passed" | "warning" | "failed";

export type SecurityCheck = {
  id: string;
  category: "authentication" | "authorization" | "data_protection" | "network" | "sanitization";
  name: string;
  status: SecurityCheckStatus;
  description: string;
  scoreImpact: number;
};

export type SecretRotationLog = {
  secretId: string;
  serviceName: string;
  lastRotated: string;
  nextRotationDue: string;
  autoRotate: boolean;
};

export type SecurityPosture = {
  overallScore: number;
  passedChecks: number;
  totalChecks: number;
  grade: string;
  statusLabel: string;
};
