/**
 * Record financial events onto Ledger + Audit without importing Payment adapters.
 */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFinancialPlatform } from "@/lib/financial";
import type { LedgerEntryType } from "@/lib/yip/capabilities/financial/types";

export async function recordFinancialEvent(input: {
  admin: SupabaseClient;
  type: LedgerEntryType;
  accountId: string;
  amount: number;
  currency?: string;
  reference: string;
  capability: string;
  provider?: string | null;
  actorId?: string | null;
  status?: string;
  paymentOrderId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}): Promise<{ persisted: boolean; correlationId: string }> {
  const financial = getFinancialPlatform();
  const correlationId = input.correlationId ?? randomUUID();

  const { persisted } = await financial.ledger.recordPair({
    type: input.type,
    accountId: input.accountId,
    amount: input.amount,
    currency: input.currency ?? "NGN",
    reference: input.reference,
    correlationId,
    capability: input.capability,
    provider: input.provider ?? null,
    metadata: input.metadata,
    paymentOrderId: input.paymentOrderId,
    admin: input.admin,
  });

  financial.audit.record({
    actorId: input.actorId ?? null,
    capability: input.capability,
    provider: input.provider ?? null,
    amount: input.amount,
    currency: input.currency ?? "NGN",
    status: input.status ?? "completed",
    reference: input.reference,
    correlationId,
    metadata: input.metadata,
  });

  financial.transaction.create({
    amount: input.amount,
    currency: input.currency ?? "NGN",
    reference: input.reference,
    module: input.capability,
    correlationId,
  });

  return { persisted, correlationId };
}
