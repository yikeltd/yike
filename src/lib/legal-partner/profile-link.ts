import type { SupabaseClient } from "@supabase/supabase-js";

export async function linkLegalPartnerProfileByEmail(
  client: SupabaseClient,
  profileId: string,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { data: application } = await client
    .from("legal_partner_applications")
    .select("id")
    .ilike("email", normalized)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) return;

  const { data: partner } = await client
    .from("legal_partners")
    .select("id, profile_id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (!partner || partner.profile_id) return;

  await client
    .from("legal_partners")
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .eq("id", partner.id);

  const { data: profile } = await client
    .from("profiles")
    .select("account_type")
    .eq("id", profileId)
    .single();

  if (profile?.account_type !== "city_ambassador" && profile?.account_type !== "field_verifier") {
    await client.from("profiles").update({ account_type: "legal_partner" }).eq("id", profileId);
  }
}
