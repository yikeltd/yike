import type { SupabaseClient } from "@supabase/supabase-js";

export type UserAuditEntry = {
  id: string;
  action: string;
  actor_name?: string | null;
  actor_role: string | null;
  summary?: string | null;
  reason?: string | null;
  risk_level?: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchUserAuditLogs(
  supabase: SupabaseClient,
  userId: string,
  limit = 30
): Promise<UserAuditEntry[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, action, actor_name, actor_role, summary, reason, risk_level, target_type, target_id, metadata, created_at"
    )
    .or(`target_id.eq.${userId},target_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as UserAuditEntry[];
}
