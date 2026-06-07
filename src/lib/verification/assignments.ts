import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAssignmentExpireHours(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from("field_verifier_program_config")
    .select("assignment_expire_hours")
    .eq("id", true)
    .maybeSingle();
  return Number(data?.assignment_expire_hours ?? 2);
}

export function assignmentExpiresAt(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export async function expireStaleAssignments(client: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data: stale } = await client
    .from("property_verification_requests")
    .select("id, assigned_verifier_id")
    .eq("status", "assigned")
    .lt("assignment_expires_at", now)
    .not("assignment_expires_at", "is", null);

  if (!stale?.length) return 0;

  for (const row of stale) {
    await client
      .from("property_verification_requests")
      .update({
        status: "awaiting_assignment",
        assigned_verifier_id: null,
        assigned_at: null,
        assignment_expires_at: null,
        updated_at: now,
      })
      .eq("id", row.id);

    if (row.assigned_verifier_id) {
      const { data: v } = await client
        .from("field_verifiers")
        .select("assignments_expired, response_score")
        .eq("id", row.assigned_verifier_id)
        .single();

      await client
        .from("field_verifiers")
        .update({
          assignments_expired: (v?.assignments_expired ?? 0) + 1,
          response_score: Math.max(0, Number(v?.response_score ?? 100) - 2),
          updated_at: now,
        })
        .eq("id", row.assigned_verifier_id);
    }
  }

  return stale.length;
}

export async function getReportValidUntil(client: SupabaseClient): Promise<string> {
  const { data } = await client
    .from("field_verifier_program_config")
    .select("report_valid_days")
    .eq("id", true)
    .maybeSingle();
  const days = Number(data?.report_valid_days ?? 14);
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
