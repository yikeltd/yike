import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEntitySearchResult, AdminEntityType } from "./types";
import { buildIlikeOr, isUuid } from "./utils";

function mapPartner(
  type: AdminEntityType,
  row: Record<string, unknown>
): AdminEntitySearchResult {
  if (type === "verifier") {
    const r = row as {
      id: string;
      full_name: string | null;
      verifier_code: string;
      assigned_city: string;
      assigned_state: string;
      status: string;
    };
    return {
      id: r.id,
      display_name: r.full_name?.trim() || r.verifier_code,
      subtitle: `${r.assigned_city}, ${r.assigned_state} · ${r.status}`,
      image_url: null,
      badge: r.status,
      meta: { verifier_code: r.verifier_code },
    };
  }

  if (type === "ambassador") {
    const r = row as {
      id: string;
      ambassador_code: string;
      assigned_city: string;
      assigned_state: string;
      status: string;
      profile?: { full_name: string | null } | { full_name: string | null }[] | null;
    };
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return {
      id: r.id,
      display_name: profile?.full_name?.trim() || r.ambassador_code,
      subtitle: `${r.assigned_city}, ${r.assigned_state} · ${r.status}`,
      image_url: null,
      badge: r.status,
      meta: { ambassador_code: r.ambassador_code },
    };
  }

  const r = row as {
    id: string;
    firm_name: string;
    partner_code: string;
    city: string | null;
    state: string | null;
    status: string;
  };
  return {
    id: r.id,
    display_name: r.firm_name,
    subtitle: [r.city, r.state, r.status].filter(Boolean).join(" · "),
    image_url: null,
    badge: r.status,
    meta: { partner_code: r.partner_code },
  };
}

function tableForType(type: AdminEntityType): string {
  if (type === "verifier") return "field_verifiers";
  if (type === "ambassador") return "city_ambassadors";
  return "legal_partners";
}

function selectForType(type: AdminEntityType): string {
  if (type === "verifier") {
    return "id, full_name, verifier_code, assigned_city, assigned_state, status";
  }
  if (type === "ambassador") {
    return "id, ambassador_code, assigned_city, assigned_state, status, profile:profiles(full_name)";
  }
  return "id, firm_name, partner_code, city, state, status";
}

function searchFieldsForType(type: AdminEntityType): string[] {
  if (type === "verifier") {
    return ["full_name", "verifier_code", "assigned_city", "assigned_state"];
  }
  if (type === "ambassador") {
    return ["ambassador_code", "assigned_city", "assigned_state"];
  }
  return ["firm_name", "partner_code", "city", "state"];
}

export async function searchAdminPartners(
  admin: SupabaseClient,
  type: AdminEntityType,
  query: string,
  limit = 15
): Promise<AdminEntitySearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const table = tableForType(type);
  let dbQuery = admin.from(table).select(selectForType(type)).limit(limit);

  if (isUuid(q)) {
    dbQuery = dbQuery.eq("id", q);
  } else {
    dbQuery = dbQuery.or(buildIlikeOr(searchFieldsForType(type), q));
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPartner(type, row as unknown as Record<string, unknown>));
}

export async function fetchPartnersByIds(
  admin: SupabaseClient,
  type: AdminEntityType,
  ids: string[]
): Promise<AdminEntitySearchResult[]> {
  if (ids.length === 0) return [];
  const table = tableForType(type);
  const { data, error } = await admin
    .from(table)
    .select(selectForType(type))
    .in("id", ids);
  if (error) throw new Error(error.message);
  const mapped = (data ?? []).map((row) => mapPartner(type, row as unknown as Record<string, unknown>));
  const byId = new Map(mapped.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as AdminEntitySearchResult[];
}
