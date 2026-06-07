import type { SupabaseClient } from "@supabase/supabase-js";

export type FraudCheckInput = {
  ambassadorProfileId?: string | null;
  ambassadorEmail?: string | null;
  ambassadorWhatsapp?: string | null;
  referredUserId: string;
  referredEmail?: string | null;
  referredPhone?: string | null;
};

export function detectSelfReferral(input: FraudCheckInput): boolean {
  if (input.ambassadorProfileId && input.ambassadorProfileId === input.referredUserId) {
    return true;
  }
  const ambEmail = input.ambassadorEmail?.trim().toLowerCase();
  const refEmail = input.referredEmail?.trim().toLowerCase();
  if (ambEmail && refEmail && ambEmail === refEmail) return true;

  const norm = (p?: string | null) => (p ?? "").replace(/\D/g, "").slice(-10);
  const ambPhone = norm(input.ambassadorWhatsapp);
  const refPhone = norm(input.referredPhone);
  if (ambPhone.length >= 10 && ambPhone === refPhone) return true;

  return false;
}

export async function flagAmbassadorFraud(
  client: SupabaseClient,
  ambassadorId: string,
  reason: string
): Promise<void> {
  const { data } = await client
    .from("city_ambassadors")
    .select("fraud_flags_count")
    .eq("id", ambassadorId)
    .single();

  const count = (data?.fraud_flags_count as number | undefined) ?? 0;
  await client
    .from("city_ambassadors")
    .update({
      fraud_flags_count: count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  console.warn("[ambassador/fraud]", ambassadorId, reason);
}
