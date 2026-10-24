import type { SupabaseClient } from "@supabase/supabase-js";

export type PurchaseEntitlementStatus = "debited" | "fulfilled" | "reversed" | "failed";

export async function upsertPurchaseEntitlement(
  admin: SupabaseClient,
  input: {
    userId: string;
    serviceCode: string;
    idempotencyKey: string;
    debitLedgerId: string;
    entityType?: string | null;
    entityId?: string | null;
    status?: PurchaseEntitlementStatus;
  }
): Promise<void> {
  await admin.from("yike_coin_purchase_entitlements").upsert(
    {
      user_id: input.userId,
      service_code: input.serviceCode,
      idempotency_key: input.idempotencyKey,
      debit_ledger_id: input.debitLedgerId,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      status: input.status ?? "debited",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idempotency_key" }
  );
}

export async function markEntitlementFulfilled(
  admin: SupabaseClient,
  idempotencyKey: string
): Promise<void> {
  await admin
    .from("yike_coin_purchase_entitlements")
    .update({ status: "fulfilled", updated_at: new Date().toISOString() })
    .eq("idempotency_key", idempotencyKey);
}

export async function markEntitlementReversed(
  admin: SupabaseClient,
  idempotencyKey: string,
  reversalLedgerId: string
): Promise<void> {
  await admin
    .from("yike_coin_purchase_entitlements")
    .update({
      status: "reversed",
      reversal_ledger_id: reversalLedgerId,
      updated_at: new Date().toISOString(),
    })
    .eq("idempotency_key", idempotencyKey);
}
