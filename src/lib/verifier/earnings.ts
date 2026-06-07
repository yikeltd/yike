import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_VERIFIER_FEE, EARNINGS_HOLD_DAYS, lagosYearMonth } from "./constants";

export async function createVerifierEarning(
  client: SupabaseClient,
  params: {
    verifierId: string;
    verificationRequestId: string;
    amount: number;
  }
): Promise<void> {
  const payableAt = new Date(
    Date.now() + EARNINGS_HOLD_DAYS * 86_400_000
  ).toISOString();

  await client.from("field_verifier_earnings").upsert(
    {
      verifier_id: params.verifierId,
      verification_request_id: params.verificationRequestId,
      amount: params.amount,
      status: "pending",
      payable_at: payableAt,
    },
    { onConflict: "verification_request_id" }
  );

  const { data: v } = await client
    .from("field_verifiers")
    .select("total_earnings, completed_inspections")
    .eq("id", params.verifierId)
    .single();

  await client
    .from("field_verifiers")
    .update({
      total_earnings: Number(v?.total_earnings ?? 0) + params.amount,
      completed_inspections: (v?.completed_inspections ?? 0) + 1,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.verifierId);
}

export async function getDefaultVerifierFee(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from("field_verifier_program_config")
    .select("default_verifier_fee")
    .eq("id", true)
    .maybeSingle();
  return Number(data?.default_verifier_fee ?? DEFAULT_VERIFIER_FEE);
}

export async function releaseDueVerifierEarnings(client: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data: due } = await client
    .from("field_verifier_earnings")
    .select("id")
    .eq("status", "pending")
    .eq("fraud_review", false)
    .lte("payable_at", now);

  if (!due?.length) return 0;
  await client
    .from("field_verifier_earnings")
    .update({ status: "payable", updated_at: now })
    .in(
      "id",
      due.map((d) => d.id)
    );
  return due.length;
}

export { lagosYearMonth };
