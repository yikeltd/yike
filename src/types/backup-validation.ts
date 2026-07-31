export type TargetDataType = "database" | "media" | "escrow_ledger" | "users" | "search_index";

export type RestoreValidationCheck = {
  id: string;
  targetData: TargetDataType;
  name: string;
  snapshotId: string;
  restoredRecordCount: number;
  expectedRecordCount: number;
  checksumMatched: boolean;
  restoreDurationSec: number;
  status: "verified" | "failed" | "in_progress";
  verifiedAt: string;
};

export type SnapshotHistoryItem = {
  snapshotId: string;
  type: string;
  sizeGb: number;
  encryptedAes256: boolean;
  geoReplicated: boolean;
  timestamp: string;
};

export type BackupIntegrityMetric = {
  overallIntegrityScore: number;
  verifiedRestoresCount: number;
  totalSnapshotsCount: number;
  zeroDataLossVerified: boolean;
  lastRestoreTestAt: string;
};
