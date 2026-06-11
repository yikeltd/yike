import type { SupabaseClient, User } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";

export type AdminUserFilter =
  | "all"
  | "users"
  | "individuals"
  | "agents"
  | "landlords"
  | "developers"
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
  account_type: string | null;
  account_status: string | null;
  profile_status: string | null;
  is_banned: boolean;
  created_at: string;
  profile_missing: boolean;
  account_kind:
    | "user"
    | "individual"
    | "agent"
    | "landlord"
    | "developer"
    | "company"
    | "staff"
    | "ghost";
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

export class AdminUsersDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUsersDirectoryError";
  }
}

function classifyProfile(row: {
  role: string;
  account_type?: string | null;
  company_name?: string | null;
}): AdminDirectoryRow["account_kind"] {
  const role = row.role;
  const accountType = row.account_type;

  if (STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) return "staff";
  if (accountType === "individual") return "individual";
  if (accountType === "landlord") return "landlord";
  if (accountType === "developer") return "developer";
  if (accountType === "agency") return "company";
  if (accountType === "agent") return "agent";
  if (AGENT_ROLES.includes(role as (typeof AGENT_ROLES)[number])) return "agent";
  if (row.company_name?.trim()) return "company";
  return "user";
}

function matchesFilter(row: AdminDirectoryRow, filter: AdminUserFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "users":
      return row.account_kind === "user" && !row.profile_missing;
    case "individuals":
      return row.account_kind === "individual";
    case "agents":
      return row.account_kind === "agent";
    case "landlords":
      return row.account_kind === "landlord";
    case "developers":
      return row.account_kind === "developer";
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
    account_type: (p.account_type as string | null) ?? null,
    account_status: (p.account_status as string | null) ?? null,
    profile_status: (p.profile_status as string | null) ?? null,
    is_banned: Boolean(p.is_banned),
    created_at: String(p.created_at ?? new Date().toISOString()),
    profile_missing: false,
    account_kind: classifyProfile({
      role,
      account_type: (p.account_type as string | null) ?? null,
      company_name: (p.company_name as string | null) ?? null,
    }),
    email_verified: (p.email_verified as boolean | null) ?? null,
    company_name: (p.company_name as string | null) ?? null,
  };
}

function authUserToMissingProfileRow(u: User): AdminDirectoryRow {
  return {
    id: u.id,
    full_name:
      (u.user_metadata?.full_name as string | undefined) ??
      (u.user_metadata?.name as string | undefined) ??
      null,
    email: u.email ?? null,
    role: "—",
    account_type: null,
    account_status: null,
    profile_status: null,
    is_banned: false,
    created_at: u.created_at,
    profile_missing: true,
    account_kind: "ghost",
    email_verified: Boolean(u.email_confirmed_at),
    company_name: null,
  };
}

function mergeAuthUserWithProfile(
  authUser: User,
  profile: Record<string, unknown> | undefined
): AdminDirectoryRow {
  if (!profile) return authUserToMissingProfileRow(authUser);
  const row = profileToRow(profile);
  return {
    ...row,
    created_at: row.created_at || authUser.created_at,
    email: row.email ?? authUser.email ?? null,
    full_name:
      row.full_name ??
      ((authUser.user_metadata?.full_name as string | undefined) ||
        (authUser.user_metadata?.name as string | undefined) ||
        null),
    email_verified: row.email_verified ?? Boolean(authUser.email_confirmed_at),
  };
}

async function listAllAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  let page = 1;

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("[users-directory] auth admin listUsers failed:", error.message);
      throw new AdminUsersDirectoryError(
        "Supabase service role cannot access auth admin. Check service role key/project match."
      );
    }

    users.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

async function fetchProfilesByIds(
  admin: SupabaseClient,
  ids: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const profiles = new Map<string, Record<string, unknown>>();

  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, full_name, email, role, account_status, profile_status, is_banned, created_at, email_verified, account_type, company_name"
      )
      .in("id", chunk);

    if (error) {
      console.error("[users-directory] profiles query failed:", error.message);
      throw new AdminUsersDirectoryError("Supabase service role cannot query profiles.");
    }

    for (const p of data ?? []) {
      profiles.set(String(p.id), p as Record<string, unknown>);
    }
  }

  return profiles;
}

export async function fetchMissingProfileRows(
  admin: SupabaseClient,
  limit = 50
): Promise<AdminDirectoryRow[]> {
  const authUsers = await listAllAuthUsers(admin);
  const profiles = await fetchProfilesByIds(
    admin,
    authUsers.map((u) => u.id)
  );

  return authUsers
    .filter((u) => !profiles.has(u.id))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, limit)
    .map((u) => authUserToMissingProfileRow(u));
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
  const authUsers = await listAllAuthUsers(admin);
  const profiles = await fetchProfilesByIds(
    admin,
    authUsers.map((u) => u.id)
  );
  let rows = authUsers.map((u) => mergeAuthUserWithProfile(u, profiles.get(u.id)));
  const q = options.q?.trim();
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.full_name?.toLowerCase().includes(needle) ||
        row.email?.toLowerCase().includes(needle) ||
        row.company_name?.toLowerCase().includes(needle)
    );
  }

  rows = rows
    .filter((row) => matchesFilter(row, filter))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return {
    rows: rows.slice(options.from, options.to + 1),
    total: rows.length,
  };
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
    account_type: null,
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

export function accountKindLabel(kind: AdminDirectoryRow["account_kind"]): string {
  switch (kind) {
    case "individual":
      return "Individual";
    case "agent":
      return "Agent";
    case "landlord":
      return "Landlord";
    case "developer":
      return "Developer";
    case "company":
      return "Company";
    case "staff":
      return "Staff";
    case "user":
      return "User";
    default:
      return "—";
  }
}
