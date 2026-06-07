import type { SupabaseClient } from "@supabase/supabase-js";

export async function linkVerifierProfileByEmail(
  client: SupabaseClient,
  profileId: string,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { data: application } = await client
    .from("field_verifier_applications")
    .select("id")
    .ilike("email", normalized)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) return;

  const { data: verifier } = await client
    .from("field_verifiers")
    .select("id, profile_id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (!verifier || verifier.profile_id) return;

  const now = new Date().toISOString();
  await client
    .from("field_verifiers")
    .update({ profile_id: profileId, updated_at: now })
    .eq("id", verifier.id);
  await client
    .from("profiles")
    .update({ account_type: "field_verifier" })
    .eq("id", profileId);
}
