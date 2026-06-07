import type { SupabaseClient } from "@supabase/supabase-js";
import { detectSelfReferral, flagAmbassadorFraud } from "./fraud";
import { normalizeAmbassadorCode } from "./constants";

export type AttributionResult =
  | { ok: true; ambassadorId: string }
  | { ok: false; reason: string };

export async function findAmbassadorByCode(
  client: SupabaseClient,
  code: string
): Promise<{
  id: string;
  profile_id: string | null;
  status: string;
  ambassador_code: string;
} | null> {
  const normalized = normalizeAmbassadorCode(code);
  const { data } = await client
    .from("city_ambassadors")
    .select("id, profile_id, status, ambassador_code")
    .eq("ambassador_code", normalized)
    .maybeSingle();
  return data ?? null;
}

export async function applyAmbassadorAttribution(
  client: SupabaseClient,
  params: {
    userId: string;
    referralCode: string;
    userEmail?: string | null;
    userPhone?: string | null;
  }
): Promise<AttributionResult> {
  const ambassador = await findAmbassadorByCode(client, params.referralCode);
  if (!ambassador) {
    return { ok: false, reason: "invalid_code" };
  }

  if (ambassador.status !== "approved") {
    return { ok: false, reason: "ambassador_inactive" };
  }

  const { data: profile } = await client
    .from("profiles")
    .select(
      "id, referred_by_ambassador_id, attribution_locked, email, phone, whatsapp"
    )
    .eq("id", params.userId)
    .single();

  if (!profile) {
    return { ok: false, reason: "profile_missing" };
  }

  if (profile.referred_by_ambassador_id || profile.attribution_locked) {
    return { ok: false, reason: "already_attributed" };
  }

  let ambassadorEmail: string | null = null;
  let ambassadorWhatsapp: string | null = null;
  if (ambassador.profile_id) {
    const { data: ambProfile } = await client
      .from("profiles")
      .select("email, whatsapp, phone")
      .eq("id", ambassador.profile_id)
      .maybeSingle();
    ambassadorEmail = ambProfile?.email ?? null;
    ambassadorWhatsapp = ambProfile?.whatsapp ?? ambProfile?.phone ?? null;
  } else {
    const { data: app } = await client
      .from("city_ambassadors")
      .select("application_id")
      .eq("id", ambassador.id)
      .single();
    if (app?.application_id) {
      const { data: application } = await client
        .from("ambassador_applications")
        .select("email, whatsapp")
        .eq("id", app.application_id)
        .maybeSingle();
      ambassadorEmail = application?.email ?? null;
      ambassadorWhatsapp = application?.whatsapp ?? null;
    }
  }

  if (
    detectSelfReferral({
      ambassadorProfileId: ambassador.profile_id,
      ambassadorEmail,
      ambassadorWhatsapp,
      referredUserId: params.userId,
      referredEmail: params.userEmail ?? profile.email,
      referredPhone: params.userPhone ?? profile.phone ?? profile.whatsapp,
    })
  ) {
    await flagAmbassadorFraud(client, ambassador.id, "self_referral");
    return { ok: false, reason: "fraud_self_referral" };
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from("profiles")
    .update({
      referred_by_ambassador_id: ambassador.id,
      referral_code_used: ambassador.ambassador_code,
      attributed_at: now,
      attribution_locked: true,
    })
    .eq("id", params.userId);

  if (error) {
    console.error("[ambassador/attribution] update failed:", error.message);
    return { ok: false, reason: "update_failed" };
  }

  const { data: ambRow } = await client
    .from("city_ambassadors")
    .select("onboarding_count")
    .eq("id", ambassador.id)
    .single();

  await client
    .from("city_ambassadors")
    .update({
      onboarding_count: ((ambRow?.onboarding_count as number) ?? 0) + 1,
      last_activity_at: now,
      updated_at: now,
    })
    .eq("id", ambassador.id);

  return { ok: true, ambassadorId: ambassador.id };
}

export async function linkAmbassadorProfileByEmail(
  client: SupabaseClient,
  profileId: string,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { data: application } = await client
    .from("ambassador_applications")
    .select("id")
    .ilike("email", normalized)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) return;

  const { data: ambassador } = await client
    .from("city_ambassadors")
    .select("id, profile_id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (!ambassador || ambassador.profile_id) return;

  const now = new Date().toISOString();
  await client
    .from("city_ambassadors")
    .update({ profile_id: profileId, updated_at: now })
    .eq("id", ambassador.id);
  await client
    .from("profiles")
    .update({ account_type: "city_ambassador" })
    .eq("id", profileId);
}
