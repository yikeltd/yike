import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PARTNER_FEE, EARNINGS_HOLD_DAYS, lagosYearMonth } from "./constants";

export async function createLegalPartnerEarning(
  client: SupabaseClient,
  params: { partnerId: string; legalRequestId: string; amount: number }
): Promise<void> {
  const payableAt = new Date(Date.now() + EARNINGS_HOLD_DAYS * 86_400_000).toISOString();

  await client.from("legal_partner_earnings").upsert(
    {
      partner_id: params.partnerId,
      legal_request_id: params.legalRequestId,
      amount: params.amount,
      status: "pending",
      payable_at: payableAt,
    },
    { onConflict: "legal_request_id" }
  );

  const { data: p } = await client
    .from("legal_partners")
    .select("total_earnings, completed_reviews")
    .eq("id", params.partnerId)
    .single();

  await client
    .from("legal_partners")
    .update({
      total_earnings: Number(p?.total_earnings ?? 0) + params.amount,
      completed_reviews: (p?.completed_reviews ?? 0) + 1,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.partnerId);
}

export async function getDefaultPartnerFee(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from("legal_partner_program_config")
    .select("default_partner_fee")
    .eq("id", true)
    .maybeSingle();
  return Number(data?.default_partner_fee ?? DEFAULT_PARTNER_FEE);
}

export async function releaseDueLegalEarnings(client: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data: due } = await client
    .from("legal_partner_earnings")
    .select("id")
    .eq("status", "pending")
    .eq("fraud_review", false)
    .lte("payable_at", now);

  if (!due?.length) return 0;
  await client
    .from("legal_partner_earnings")
    .update({ status: "payable", updated_at: now })
    .in(
      "id",
      due.map((d) => d.id)
    );
  return due.length;
}

export { lagosYearMonth };
