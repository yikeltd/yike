export type UserScaleLevel = "10_users" | "100_users" | "1k_users" | "10k_users" | "50k_users" | "100k_users";

export type LoadTestScenario = {
  id: string;
  userScaleLabel: string;
  concurrentUsers: number;
  targetRps: number;
  testDurationSec: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
  dbConnPoolUsage: number;
  queueGrowthRate: number;
  status: "passed" | "running" | "idle";
};

export type StressTestResult = {
  testId: string;
  timestamp: string;
  maxUsers: number;
  peakRps: number;
  memoryPeakGb: number;
  cpuPeakPercent: number;
  bottleneckIdentified: string;
};

export type ResourceSaturationMetric = {
  metricName: string;
  currentPeak: string;
  maxLimit: string;
  saturationPercent: number;
  health: "optimal" | "elevated" | "saturated";
};
