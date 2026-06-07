import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";

export type AdminUserFilter =
  | "all"
  | "users"
  | "agents"
  | "companies"
  | "staff"
  | "missing_profile"
  | "suspended"
  | "on_hold";

export type AdminDirectoryRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  account_status: string | null;
  profile_status: string | null;
  is_banned: boolean;
  created_at: string;
  profile_missing: boolean;
  account_kind: "user" | "agent" | "company" | "staff" | "ghost";
  email_verified: boolean | null;
  company_name: string | null;
};

const AGENT_ROLES = ["agent", "agent_unverified", "agent_verified"] as const;
const STAFF_ROLES = [
  "admin",
  "super_admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
] as const;

function isCompanyProfile(row: {
  account_type?: string | null;
  company_name?: string | null;
}): boolean {
  return (
    row.account_type === "agency" ||
    row.account_type === "developer" ||
    Boolean(row.company_name?.trim())
  );
}

function classifyProfile(row: {
  role: string;
  account_type?: string | null;
  company_name?: string | null;
}): AdminDirectoryRow["account_kind"] {
  if (STAFF_ROLES.includes(row.role as (typeof STAFF_ROLES)[number])) return "staff";
  if (AGENT_ROLES.includes(row.role as (typeof AGENT_ROLES)[number])) return "agent";
  if (isCompanyProfile(row)) return "company";
  return "user";
}

function matchesFilter(row: AdminDirectoryRow, filter: AdminUserFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "users":
      return row.account_kind === "user" && !row.profile_missing;
    case "agents":
      return row.account_kind === "agent";
    case "companies":
      return row.account_kind === "company";
    case "staff":
      return row.account_kind === "staff";
    case "missing_profile":
      return row.profile_missing;
    case "suspended":
      return row.is_banned || row.account_status === "suspended";
    case "on_hold":
      return row.account_status === "on_hold";
    default:
      return true;
  }
}

function profileToRow(p: Record<string, unknown>): AdminDirectoryRow {
  const role = String(p.role ?? "user");
  return {
    id: String(p.id),
    full_name: (p.full_name as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    role,
    account_status: (p.account_status as string | null) ?? null,
    profile_status: (p.profile_status as string | null) ?? null,
    is_banned: Boolean(p.is_banned),
    created_at: String(p.created_at ?? new Date().toISOString()),
    profile_missing: false,
    account_kind: classifyProfile({
      role,
      account_type: p.account_type as string | null,
      company_name: p.company_name as string | null,
    }),
    email_verified: (p.email_verified as boolean | null) ?? null,
    company_name: (p.company_name as string | null) ?? null,
  };
}

export async function fetchMissingProfileRows(
  admin: SupabaseClient,
  limit = 50
): Promise<AdminDirectoryRow[]> {
  const { data: profiles } = await admin.from("profiles").select("id");
  const profileIdSet = new Set((profiles ?? []).map((p) => p.id as string));

  const ghosts: AdminDirectoryRow[] = [];
  let page = 1;

  while (ghosts.length < limit && page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data) break;

    for (const u of data.users) {
      if (profileIdSet.has(u.id)) continue;
      ghosts.push({
        id: u.id,
        full_name:
          (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          null,
        email: u.email ?? null,
        role: "—",
        account_status: null,
        profile_status: null,
        is_banned: false,
        created_at: u.created_at,
        profile_missing: true,
        account_kind: "ghost",
        email_verified: Boolean(u.email_confirmed_at),
        company_name: null,
      });
      if (ghosts.length >= limit) break;
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return ghosts;
}

export async function fetchAdminUsersDirectory(
  admin: SupabaseClient,
  options: {
    filter?: AdminUserFilter;
    from: number;
    to: number;
    q?: string;
  }
): Promise<{ rows: AdminDirectoryRow[]; total: number }> {
  const filter = options.filter ?? "all";

  if (filter === "missing_profile") {
    const ghosts = await fetchMissingProfileRows(admin, 500);
    const q = options.q?.trim().toLowerCase();
    const filtered = q
      ? ghosts.filter(
          (g) =>
            g.email?.toLowerCase().includes(q) ||
            g.full_name?.toLowerCase().includes(q)
        )
      : ghosts;
    return {
      rows: filtered.slice(options.from, options.to + 1),
      total: filtered.length,
    };
  }

  let query = admin
    .from("profiles")
    .select(
      "id, full_name, email, role, account_status, profile_status, is_banned, created_at, email_verified, account_type, company_name",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter === "users") {
    query = query.eq("role", "user");
  } else if (filter === "agents") {
    query = query.in("role", [...AGENT_ROLES]);
  } else if (filter === "companies") {
    query = query.or(
      "account_type.eq.agency,account_type.eq.developer,company_name.not.is.null"
    );
  } else if (filter === "staff") {
    query = query.in("role", [...STAFF_ROLES]);
  } else if (filter === "suspended") {
    query = query.or("is_banned.eq.true,account_status.eq.suspended");
  } else if (filter === "on_hold") {
    query = query.eq("account_status", "on_hold");
  }

  const q = options.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    query = query.or(
      `full_name.ilike.${pattern},email.ilike.${pattern},username.ilike.${pattern},company_name.ilike.${pattern}`
    );
  }

  const { data, count, error } = await query.range(options.from, options.to);
  if (error) {
    console.error("[users-directory] query failed:", error.message);
    return { rows: [], total: 0 };
  }

  const rows = (data ?? []).map((p) => profileToRow(p as Record<string, unknown>));
  return { rows: rows.filter((r) => matchesFilter(r, filter)), total: count ?? 0 };
}

export async function lookupDirectoryUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<AdminDirectoryRow | null> {
  const authUser = await findAuthUserByEmail(admin, email);
  if (!authUser) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, role, account_status, profile_status, is_banned, created_at, email_verified, account_type, company_name"
    )
    .eq("id", authUser.id)
    .maybeSingle();

  if (profile) return profileToRow(profile as Record<string, unknown>);

  return {
    id: authUser.id,
    full_name: (authUser.user_metadata?.full_name as string) ?? null,
    email: authUser.email ?? null,
    role: "—",
    account_status: null,
    profile_status: null,
    is_banned: false,
    created_at: authUser.created_at,
    profile_missing: true,
    account_kind: "ghost",
    email_verified: Boolean(authUser.email_confirmed_at),
    company_name: null,
  };
}
