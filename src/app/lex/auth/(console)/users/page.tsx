import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createVerifiedAdminClient, probeSupabaseAdmin } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminUsersDirectory } from "@/components/admin/admin-users-directory";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import {
  AdminUsersDirectoryError,
  fetchAdminUsersDirectory,
  fetchMissingProfileRows,
  type AdminDirectoryRow,
  type AdminUserFilter,
} from "@/lib/admin/users-directory";

export const runtime = "nodejs";

const FILTERS: AdminUserFilter[] = [
  "all",
  "users",
  "agents",
  "companies",
  "missing_profile",
  "suspended",
  "on_hold",
  "staff",
];

function parseFilter(raw: string | undefined): AdminUserFilter {
  return FILTERS.includes(raw as AdminUserFilter) ? (raw as AdminUserFilter) : "all";
}

async function DatabaseUnavailable({
  message,
}: {
  message?: string;
}) {
  const diagnostics = await probeSupabaseAdmin();

  const checks = [
    ["serviceRolePresent", diagnostics.serviceRolePresent],
    ["supabaseUrlPresent", diagnostics.supabaseUrlPresent],
    ["authAdminReachable", diagnostics.authAdminReachable],
    ["profilesReachable", diagnostics.profilesReachable],
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Users" description="Database unavailable" />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">
          {message ??
            "Supabase service role cannot access auth admin. Check service role key/project match."}
        </p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {checks.map(([label, ok]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"
            >
              <dt className="font-mono text-xs">{label}</dt>
              <dd className={ok ? "font-bold text-emerald-700" : "font-bold text-red-700"}>
                {String(ok)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-amber-900">
          Confirm Vercel Production has NEXT_PUBLIC_SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY from the same Supabase project, then redeploy production.
        </p>
      </div>
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const filter = parseFilter(sp.filter);
  const q = sp.q?.trim() ?? "";

  const admin = await createVerifiedAdminClient();
  if (!admin) {
    return <DatabaseUnavailable />;
  }

  let rows: AdminDirectoryRow[] = [];
  let total = 0;
  try {
    const result = await fetchAdminUsersDirectory(admin, {
      filter,
      from,
      to,
      q,
    });
    rows = result.rows;
    total = result.total;
  } catch (error) {
    if (error instanceof AdminUsersDirectoryError) {
      return <DatabaseUnavailable message={error.message} />;
    }
    console.error("[admin-users-page] users directory failed:", error);
    return <DatabaseUnavailable />;
  }

  const missingPreview =
    filter === "all" ? await fetchMissingProfileRows(admin, 5) : [];

  const pageParams: Record<string, string> = {};
  if (filter !== "all") pageParams.filter = filter;
  if (q) pageParams.q = q;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users & accounts"
        description={`${total} matching · includes auth users missing profiles`}
      />

      {missingPreview.length > 0 && filter === "all" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {missingPreview.length}+ account(s) exist in auth without a profile row.{" "}
          <Link href="/lex/auth/auth-sync" className="font-bold underline">
            Open Auth Sync
          </Link>{" "}
          or filter by <strong>Missing profile</strong>.
        </p>
      )}

      <AdminUsersDirectory
        initialRows={rows}
        filter={filter}
        query={q}
        total={total}
      />

      <AdminPagination
        basePath="/lex/auth/users"
        total={total}
        page={page}
        params={pageParams}
      />
    </div>
  );
}
