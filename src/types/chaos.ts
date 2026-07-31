export type TargetComponent = "redis" | "database" | "worker" | "storage" | "sms" | "region" | "dns";

export type ChaosExperiment = {
  id: string;
  name: string;
  targetComponent: TargetComponent;
  simulatedFailure: string;
  recoveryTimeSec: number;
  failoverTimeSec: number;
  recoveredServicesPercent: number;
  lostRequests: number;
  autoRecoveryStatus: "passed" | "running" | "idle";
};

export type ChaosMetric = {
  totalExperimentsRun: number;
  overallResilienceScore: number;
  avgRecoveryTimeSec: number;
  zeroDataLossVerified: boolean;
  lastFaultInjectionAt: string;
};
