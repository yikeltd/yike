export type BtosEventVersion = "v1" | "v2";

export type BtosEventStatus = "processed" | "queued" | "compensated" | "failed";

export type BtosEvent = {
  eventId: string;
  eventType: string;
  version: BtosEventVersion;
  passportId: string;
  publisher: string;
  timestamp: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: BtosEventStatus;
  retryCount: number;
};

export type SagaStep = {
  stepId: string;
  actionName: string;
  status: "completed" | "pending" | "compensated";
  compensationHandler: string;
};

export type IdempotencyRecord = {
  idempotencyKey: string;
  processedAt: string;
  responseHash: string;
};
