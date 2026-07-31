export type ReadinessPillarStatus = "passed" | "warning" | "failed";

export type ReadinessPillar = {
  id: string;
  sprintId: string;
  name: string;
  score: string;
  metricSummary: string;
  status: ReadinessPillarStatus;
  route: string;
  details: string[];
};

export type ProductionReadinessScorecard = {
  overallReadinessPercent: number;
  passedPillars: number;
  totalPillars: number;
  launchGateStatus: "READY_FOR_LAUNCH_CERTIFICATION";
  certifiedAt: string;
};
