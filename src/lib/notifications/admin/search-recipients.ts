import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecipientSearchType } from "@/lib/notifications/admin/constants";

const AGENT_ROLES = ["agent", "agent_unverified", "agent_verified"] as const;
const COMPANY_OR_FILTER =
  "account_type.eq.agency,account_type.eq.developer,company_name.not.is.null";

export type RecipientSearchResult = {
  id: string;
  display_name: string;
  subtitle: string;
  avatar_url: string | null;
  type: RecipientSearchType;
  status: string | null;
  verification_status: string | null;
};

function escapeIlike(q: string): string {
  return q.replace(/[%_]/g, "");
}

function buildSearchOr(q: string, extra: string[] = []): string {
  const pattern = `%${escapeIlike(q)}%`;
  const fields = [
    `full_name.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `phone.ilike.${pattern}`,
    `whatsapp.ilike.${pattern}`,
    `company_name.ilike.${pattern}`,
    `public_agent_code.ilike.${pattern}`,
    `company_slug.ilike.${pattern}`,
    `username.ilike.${pattern}`,
    ...extra,
  ];
  return fields.join(",");
}

function displayName(row: {
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
}): string {
  return (
    row.company_name?.trim() ||
    row.full_name?.trim() ||
    row.email?.trim() ||
    "Unknown"
  );
}

function userSubtitle(row: {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}): string {
  const parts = [row.email, row.phone ?? row.whatsapp].filter(Boolean);
  return parts.join(" · ") || "No contact on file";
}

function agentSubtitle(row: {
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  verification_status?: string | null;
  listing_count?: number;
}): string {
  const verified =
    row.role === "agent_verified" ? "Verified" : "Unverified";
  const contact = row.email ?? row.phone ?? "";
  const listings =
    row.listing_count != null ? `${row.listing_count} listings` : "";
  return [verified, contact, listings].filter(Boolean).join(" · ");
}

function companySubtitle(row: {
  full_name?: string | null;
  office_address?: string | null;
  company_verified?: boolean | null;
}): string {
  const owner = row.full_name?.trim() ? `Owner: ${row.full_name}` : "";
  const location = row.office_address?.trim() ?? "";
  const verified = row.company_verified ? "Verified" : "Unverified";
  return [verified, owner, location].filter(Boolean).join(" · ");
}

async function listingCountsByAgent(
  admin: SupabaseClient,
  agentIds: string[]
): Promise<Record<string, number>> {
  if (agentIds.length === 0) return {};
  const { data } = await admin
    .from("properties")
    .select("agent_id")
    .in("agent_id", agentIds)
    .eq("status", "approved");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.agent_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchRecipientsByIds(
  admin: SupabaseClient,
  type: RecipientSearchType,
  ids: string[]
): Promise<RecipientSearchResult[]> {
  if (ids.length === 0) return [];

  let dbQuery = admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, whatsapp, avatar_url, role, verification_status, company_name, company_verified, office_address, account_type, public_agent_code"
    )
    .in("id", ids)
    .eq("is_banned", false);

  if (type === "users") {
    dbQuery = dbQuery.eq("role", "user");
  } else if (type === "agents") {
    dbQuery = dbQuery.in("role", [...AGENT_ROLES]);
  } else {
    dbQuery = dbQuery.or(COMPANY_OR_FILTER);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return mapRowsToResults(type, data ?? [], admin);
}

async function mapRowsToResults(
  type: RecipientSearchType,
  rows: Array<Record<string, unknown>>,
  admin: SupabaseClient
): Promise<RecipientSearchResult[]> {
  const listingCounts =
    type === "agents"
      ? await listingCountsByAgent(
          admin,
          rows.map((r) => r.id as string)
        )
      : {};

  return rows.map((row) => {
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
      account_status?: string | null;
    };

    const base = {
      id: r.id,
      avatar_url: r.avatar_url ?? null,
      type,
      status: r.account_status ?? null,
      verification_status: r.verification_status ?? r.role ?? null,
    };

    if (type === "users") {
      return { ...base, display_name: displayName(r), subtitle: userSubtitle(r) };
    }
    if (type === "agents") {
      return {
        ...base,
        display_name: displayName(r),
        subtitle: agentSubtitle({
          ...r,
          listing_count: listingCounts[r.id] ?? 0,
        }),
      };
    }
    return {
      ...base,
      display_name: r.company_name?.trim() || displayName(r),
      subtitle: companySubtitle(r),
      verification_status: r.company_verified ? "verified" : "unverified",
    };
  });
}

export async function searchNotificationRecipients(
  admin: SupabaseClient,
  type: RecipientSearchType,
  query: string,
  limit = 15
): Promise<RecipientSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  let dbQuery = admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, whatsapp, avatar_url, role, verification_status, company_name, company_verified, office_address, account_type, public_agent_code"
    )
    .eq("is_banned", false)
    .or(buildSearchOr(q))
    .limit(limit);

  if (type === "users") {
    dbQuery = dbQuery.eq("role", "user");
  } else if (type === "agents") {
    dbQuery = dbQuery.in("role", [...AGENT_ROLES]);
  } else {
    dbQuery = dbQuery.or(COMPANY_OR_FILTER);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);
  return mapRowsToResults(type, data ?? [], admin);
}
