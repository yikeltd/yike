export type CacheZoneStatus = "active" | "flushing" | "disabled";

export type CacheZone = {
  id: string;
  name: string;
  keyPattern: string;
  hitRatio: string;
  itemCount: number;
  memoryUsed: string;
  ttl: string;
  status: CacheZoneStatus;
  latencyMs: number;
};

export type EdgeRegion = {
  id: string;
  name: string;
  popLocation: string;
  avgLatencyMs: number;
  cacheHitRate: string;
  status: "healthy" | "degraded";
};

export type CachePurgeLog = {
  id: string;
  timestamp: string;
  pattern: string;
  purgedKeys: number;
  triggeredBy: string;
};

export type CompressionMetric = {
  format: "Brotli" | "Gzip" | "Uncompressed";
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: string;
};
