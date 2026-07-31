export type ZoneStatus = "active" | "standby" | "syncing" | "degraded";

export type AvailabilityZone = {
  id: string;
  name: string;
  regionCode: string;
  location: string;
  type: "primary" | "secondary" | "edge";
  status: ZoneStatus;
  replicationLagMs: number;
  rtoSeconds: number;
  rpoSeconds: number;
  uptimePercentage: string;
};

export type BackupSnapshot = {
  id: string;
  name: string;
  snapshotType: "database_full" | "wal_log" | "media_storage";
  sizeMb: number;
  createdAt: string;
  encrypted: boolean;
  geoReplicated: boolean;
  status: "verified" | "in_progress" | "archived";
};

export type DisasterRecoveryDrill = {
  id: string;
  drillName: string;
  simulatedScenario: string;
  failoverTimeSeconds: number;
  rpoAchievedMs: number;
  status: "passed" | "failed";
  executedAt: string;
};

export type BusinessContinuitySla = {
  targetUptime: string;
  currentAnnualUptime: string;
  targetRtoSeconds: number;
  targetRpoSeconds: number;
  zeroDataLossLedger: boolean;
};
