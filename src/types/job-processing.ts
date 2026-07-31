export type QueueStatus = "active" | "paused" | "draining";

export type JobQueue = {
  id: string;
  name: string;
  queueTopic: string;
  activeCount: number;
  waitingCount: number;
  completedCount: number;
  failedCount: number;
  throughput: string;
  status: QueueStatus;
};

export type FailedJob = {
  id: string;
  jobId: string;
  queue: string;
  timestamp: string;
  errorReason: string;
  stackTrace: string;
  retryCount: number;
  maxRetries: number;
};

export type CronJob = {
  id: string;
  name: string;
  cronExpression: string;
  scheduleHuman: string;
  lastRun: string;
  nextRun: string;
  status: "healthy" | "disabled" | "failing";
};
