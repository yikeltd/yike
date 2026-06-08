import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditRiskLevel } from "@/lib/admin/audit-risk";

export type AuditLogFilters = {
  q?: string;
  action?: string;
  actorId?: string;
  targetUserId?: string;
  targetId?: string;
  riskLevel?: AuditRiskLevel;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type EnrichedAuditLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string;
  action: string;
  summary: string | null;
  target_type: string | null;
  target_id: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  route: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  risk_level: AuditRiskLevel;
  created_at: string;
};

const DEFAULT_PAGE_SIZE = 50;

export async function fetchAuditLogs(
  supabase: SupabaseClient,
  filters: AuditLogFilters
): Promise<{ logs: EnrichedAuditLog[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, actor_role, action, summary, target_type, target_id, target_user_id, target_user_name, reason, metadata, route, ip_hash, user_agent_hash, risk_level, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters.targetUserId) query = query.eq("target_user_id", filters.targetUserId);
  if (filters.targetId) query = query.eq("target_id", filters.targetId);
  if (filters.riskLevel) query = query.eq("risk_level", filters.riskLevel);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `summary.ilike.${term},action.ilike.${term},actor_name.ilike.${term},target_user_name.ilike.${term},reason.ilike.${term}`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return { logs: [], total: 0 };

  return {
    logs: (data ?? []) as EnrichedAuditLog[],
    total: count ?? 0,
  };
}

export async function fetchRecentHighRiskActivity(
  supabase: SupabaseClient,
  limit = 12
): Promise<EnrichedAuditLog[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, actor_role, action, summary, target_type, target_id, target_user_id, target_user_name, reason, metadata, route, ip_hash, user_agent_hash, risk_level, created_at"
    )
    .in("risk_level", ["high", "critical"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as EnrichedAuditLog[];
}

export async function fetchRecentStaffActivity(
  supabase: SupabaseClient,
  limit = 15
): Promise<EnrichedAuditLog[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, actor_role, action, summary, target_type, target_id, target_user_id, target_user_name, reason, metadata, route, ip_hash, user_agent_hash, risk_level, created_at"
    )
    .not("summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as EnrichedAuditLog[];
}
