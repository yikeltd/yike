import type { SupabaseClient } from "@supabase/supabase-js";
import { STAFF_ROLES } from "@/lib/admin/roles";
import type { AdminEntitySearchResult, AdminEntityType, ProfileSearchFilters } from "./types";
import { buildIlikeOr, isUuid } from "./utils";

const AGENT_ROLES = ["agent", "agent_unverified", "agent_verified"] as const;
const COMPANY_OR_FILTER =
  "account_type.eq.agency,account_type.eq.developer,company_name.not.is.null";

const PROFILE_SELECT =
  "id, full_name, email, phone, whatsapp, avatar_url, role, verification_status, company_name, company_verified, office_address, account_type, public_agent_code, username, verified_badge";

function displayName(row: {
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  username?: string | null;
}): string {
  return (
    row.company_name?.trim() ||
    row.full_name?.trim() ||
    row.username?.trim() ||
    row.email?.trim() ||
    "Unknown"
  );
}

function mapProfile(
  type: AdminEntityType,
  row: Record<string, unknown>
): AdminEntitySearchResult {
  const r = row as {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    verification_status?: string | null;
    company_name?: string | null;
    company_verified?: boolean | null;
    office_address?: string | null;
    verified_badge?: boolean | null;
    public_agent_code?: string | null;
  };

  let subtitle = "";
  let badge: string | null = null;

  if (type === "user") {
    subtitle = [r.email, r.phone ?? r.whatsapp].filter(Boolean).join(" · ");
    badge = r.role ?? "user";
  } else if (type === "agent") {
    const verified = r.role === "agent_verified" || r.verified_badge;
    subtitle = [verified ? "Verified" : "Unverified", r.email ?? r.phone]
      .filter(Boolean)
      .join(" · ");
    badge = verified ? "Verified" : null;
  } else if (type === "company") {
    subtitle = [
      r.company_verified ? "Verified" : "Unverified",
      r.office_address?.trim(),
      r.full_name ? `Owner: ${r.full_name}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    badge = r.company_verified ? "Verified" : null;
  } else if (type === "staff") {
    subtitle = [r.role, r.email].filter(Boolean).join(" · ");
    badge = r.role ?? "staff";
  }

  return {
    id: r.id,
    display_name: type === "company" ? r.company_name?.trim() || displayName(r) : displayName(r),
    subtitle: subtitle || "No contact on file",
    image_url: r.avatar_url ?? null,
    badge,
    meta: {
      role: r.role ?? null,
      email: r.email ?? null,
      verification_status: r.verification_status ?? null,
      agent_code: r.public_agent_code ?? null,
    },
  };
}

function applyTypeFilter<T extends { eq: Function; in: Function; or: Function }>(
  dbQuery: T,
  type: AdminEntityType
): T {
  let q = dbQuery.eq("is_banned", false) as T;
  if (type === "user") return q.eq("role", "user") as T;
  if (type === "agent") return q.in("role", [...AGENT_ROLES]) as T;
  if (type === "company") return q.or(COMPANY_OR_FILTER) as T;
  if (type === "staff") return q.in("role", [...STAFF_ROLES]) as T;
  return q;
}

export async function searchAdminProfiles(
  admin: SupabaseClient,
  type: AdminEntityType,
  query: string,
  filters: ProfileSearchFilters = {},
  limit = 15
): Promise<AdminEntitySearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  let dbQuery = admin.from("profiles").select(PROFILE_SELECT).limit(limit);
  dbQuery = applyTypeFilter(dbQuery, type);

  if (isUuid(q)) {
    dbQuery = dbQuery.eq("id", q);
  } else if (q.includes("@")) {
    dbQuery = dbQuery.ilike("email", `%${q}%`);
  } else {
    const lower = q.toLowerCase();
    if (lower.includes("verified") && (type === "agent" || type === "company")) {
      if (type === "agent") dbQuery = dbQuery.eq("role", "agent_verified");
      else dbQuery = dbQuery.eq("company_verified", true);
    } else if (lower.includes("company") && type === "agent") {
      dbQuery = dbQuery.not("company_name", "is", null);
    } else {
      dbQuery = dbQuery.or(
        buildIlikeOr(
          [
            "full_name",
            "email",
            "phone",
            "whatsapp",
            "company_name",
            "public_agent_code",
            "username",
          ],
          q
        )
      );
    }
  }

  if (filters.verified && type === "agent") {
    dbQuery = dbQuery.eq("role", "agent_verified");
  }
  if (filters.city?.trim()) {
    dbQuery = dbQuery.ilike("office_address", `%${filters.city.trim()}%`);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProfile(type, row));
}

export async function fetchProfilesByIds(
  admin: SupabaseClient,
  type: AdminEntityType,
  ids: string[]
): Promise<AdminEntitySearchResult[]> {
  if (ids.length === 0) return [];
  let dbQuery = admin.from("profiles").select(PROFILE_SELECT).in("id", ids);
  dbQuery = applyTypeFilter(dbQuery, type);
  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  const mapped = (data ?? []).map((row) => mapProfile(type, row));
  const byId = new Map(mapped.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as AdminEntitySearchResult[];
}
