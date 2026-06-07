import type { SupabaseClient } from "@supabase/supabase-js";
import { supportOwnsAssignment } from "@/lib/admin/support-permissions";
import type { UserRole } from "@/types/database";

export async function assertSupportLeadAccess(
  admin: SupabaseClient,
  leadId: string,
  actorId: string,
  role: UserRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await admin
    .from("leads")
    .select("assigned_support_id")
    .eq("id", leadId)
    .maybeSingle();

  if (
    !supportOwnsAssignment(role, data?.assigned_support_id, actorId)
  ) {
    return { ok: false, error: "Not assigned to you" };
  }

  return { ok: true };
}
