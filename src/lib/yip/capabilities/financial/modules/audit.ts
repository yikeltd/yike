import { randomUUID } from "crypto";
import type { FinancialAuditRecord, ModuleHealth } from "../types";

const audits: FinancialAuditRecord[] = [];
const MAX = 2_000;

export type AuditModule = {
  record: (input: Omit<FinancialAuditRecord, "timestamp"> & { timestamp?: string }) => void;
  recent: (limit?: number) => FinancialAuditRecord[];
  health: () => ModuleHealth;
};

export function createAuditModule(): AuditModule {
  return {
    record: (input) => {
      audits.push({
        timestamp: input.timestamp ?? new Date().toISOString(),
        actorId: input.actorId,
        capability: input.capability,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        reference: input.reference,
        correlationId: input.correlationId || randomUUID(),
        riskScore: input.riskScore ?? null,
        metadata: input.metadata,
      });
      if (audits.length > MAX) audits.splice(0, audits.length - MAX);
    },
    recent: (limit = 50) => audits.slice(-limit),
    health: () => ({
      id: "audit",
      label: "Audit",
      status: "healthy",
      detail: `${audits.length} financial audit records`,
      enabled: true,
    }),
  };
}

export function __resetAuditForTests(): void {
  audits.length = 0;
}
