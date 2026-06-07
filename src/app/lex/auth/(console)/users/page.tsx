import { requireSuperAdmin } from "@/lib/auth";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminUsersDirectory } from "@/components/admin/admin-users-directory";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import {
  fetchAdminUsersDirectory,
  fetchMissingProfileRows,
  type AdminUserFilter,
} from "@/lib/admin/users-directory";

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
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Users" description="Database unavailable" />
        <p className="text-sm text-muted">
          Supabase admin client could not connect. Check SUPABASE_SERVICE_ROLE_KEY on Vercel.
        </p>
      </div>
    );
  }

  const { rows, total } = await fetchAdminUsersDirectory(admin, {
    filter,
    from,
    to,
    q,
  });

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
          <a href="/lex/auth/auth-sync" className="font-bold underline">
            Open Auth Sync
          </a>{" "}
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
