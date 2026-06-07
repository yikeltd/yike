import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeTargetType,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

const AGENT_ROLES = ["agent", "agent_unverified", "agent_verified"] as const;
const BATCH = 1000;

const COMPANY_OR_FILTER =
  "account_type.eq.agency,account_type.eq.developer,company_name.not.is.null";

function parseIds(
  filters: Record<string, unknown> | null | undefined,
  selectedIds?: string[] | null
): string[] {
  if (selectedIds?.length) {
    return [...new Set(selectedIds.map((id) => String(id).trim()).filter(Boolean))];
  }
  const raw = filters?.recipient_ids;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((id) => String(id).trim()).filter(Boolean))];
}

function companyProfilesQuery(
  admin: SupabaseClient,
  opts: { verified?: boolean; ids?: string[] } = {}
) {
  let q = admin
    .from("profiles")
    .select("id")
    .eq("is_banned", false)
    .or(COMPANY_OR_FILTER);
  if (opts.verified === true) q = q.eq("company_verified", true);
  if (opts.verified === false) q = q.eq("company_verified", false);
  if (opts.ids?.length) q = q.in("id", opts.ids);
  return q;
}

type IdQuery = {
  range: (from: number, to: number) => PromiseLike<{
    data: { id: string }[] | null;
    error: { message: string } | null;
  }>;
};

async function fetchIds(build: () => IdQuery): Promise<string[]> {
  const ids: string[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await build().range(from, from + BATCH - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { id: string }[];
    ids.push(...rows.map((r) => r.id));
    if (rows.length < BATCH) break;
    from += BATCH;
  }
  return ids;
}

export async function resolveNotificationRecipients(
  admin: SupabaseClient,
  rawTargetType: string,
  targetFilters: Record<string, unknown> = {},
  selectedRecipientIds?: string[] | null
): Promise<string[]> {
  const targetType = normalizeTargetType(rawTargetType);
  if (!targetType) return [];

  const now = new Date().toISOString();
  const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();
  const ids = parseIds(targetFilters, selectedRecipientIds);

  switch (targetType) {
    case "selected_users": {
      if (ids.length === 0) return [];
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("id", ids)
        .eq("role", "user")
        .eq("is_banned", false);
      return (data ?? []).map((r) => r.id);
    }

    case "selected_agents": {
      if (ids.length === 0) return [];
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("id", ids)
        .in("role", [...AGENT_ROLES])
        .eq("is_banned", false);
      return (data ?? []).map((r) => r.id);
    }

    case "selected_companies": {
      if (ids.length === 0) return [];
      return fetchIds(() => companyProfilesQuery(admin, { ids }));
    }

    case "all_users":
      return fetchIds(() =>
        admin.from("profiles").select("id").eq("is_banned", false)
      );

    case "all_agents":
      return fetchIds(() =>
        admin
          .from("profiles")
          .select("id")
          .in("role", [...AGENT_ROLES])
          .eq("is_banned", false)
      );

    case "all_companies":
      return fetchIds(() => companyProfilesQuery(admin));

    case "verified_agents":
      return fetchIds(() =>
        admin
          .from("profiles")
          .select("id")
          .eq("role", "agent_verified")
          .eq("is_banned", false)
      );

    case "unverified_agents":
      return fetchIds(() =>
        admin
          .from("profiles")
          .select("id")
          .in("role", ["agent", "agent_unverified"])
          .eq("is_banned", false)
      );

    case "verified_companies":
      return fetchIds(() => companyProfilesQuery(admin, { verified: true }));

    case "unverified_companies":
      return fetchIds(() => companyProfilesQuery(admin, { verified: false }));

    case "suspended_users":
      return fetchIds(() =>
        admin
          .from("profiles")
          .select("id")
          .in("account_status", ["suspended", "on_hold"])
      );

    case "expiring_listing_agents": {
      const { data: listings } = await admin
        .from("properties")
        .select("agent_id")
        .eq("status", "approved")
        .gt("expires_at", now)
        .lte("expires_at", inThreeDays);
      const agentIds = [
        ...new Set(
          (listings ?? [])
            .map((l) => l.agent_id as string | null)
            .filter(Boolean) as string[]
        ),
      ];
      if (agentIds.length === 0) return [];
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("id", agentIds)
        .eq("is_banned", false);
      return (data ?? []).map((r) => r.id);
    }

    case "pending_verification_companies": {
      const { data: requests } = await admin
        .from("company_verification_requests")
        .select("company_id")
        .in("status", ["pending", "under_review", "needs_more_info"]);
      const companyIds = [
        ...new Set(
          (requests ?? [])
            .map((r) => r.company_id as string | null)
            .filter(Boolean) as string[]
        ),
      ];
      if (companyIds.length === 0) return [];
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("id", companyIds)
        .eq("is_banned", false);
      return (data ?? []).map((r) => r.id);
    }

    default:
      return [];
  }
}
