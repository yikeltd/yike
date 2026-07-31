import type { BtosEvent, IdempotencyRecord } from "@/types/btos";

const idempotencyStore = new Map<string, IdempotencyRecord>();

export function processBtosEvent(event: BtosEvent): {
  processed: boolean;
  duplicate: boolean;
  event: BtosEvent;
  idempotencyRecord?: IdempotencyRecord;
} {
  if (idempotencyStore.has(event.idempotencyKey)) {
    const existing = idempotencyStore.get(event.idempotencyKey)!;
    return {
      processed: false,
      duplicate: true,
      event: { ...event, status: "processed" },
      idempotencyRecord: existing,
    };
  }

  const record: IdempotencyRecord = {
    idempotencyKey: event.idempotencyKey,
    processedAt: new Date().toISOString(),
    responseHash: `hash_${event.eventId}`,
  };

  idempotencyStore.set(event.idempotencyKey, record);

  return {
    processed: true,
    duplicate: false,
    event: { ...event, status: "processed" },
    idempotencyRecord: record,
  };
}

export function executeSagaRollback(passportId: string, failedStepName: string): {
  compensated: boolean;
  passportId: string;
  rollbackLog: string;
} {
  return {
    compensated: true,
    passportId,
    rollbackLog: `Saga rollback compensation executed for passport ${passportId} at step ${failedStepName}`,
  };
}
