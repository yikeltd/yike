export type GateStatus = "certified" | "pending";

export type CertificationGate = {
  id: string;
  sprintId: string;
  name: string;
  status: GateStatus;
  score: string;
  approver: string;
  approvedAt: string;
  commitHash: string;
};

export type LaunchCertificate = {
  certificateId: string;
  platformName: string;
  version: string;
  status: "CERTIFIED_PRODUCTION_READY";
  issuedAt: string;
  issuer: string;
  hmacSignature: string;
  passedGatesCount: number;
  totalGatesCount: number;
};
