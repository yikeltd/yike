import { requireSuperAdmin } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data: users, count } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at, is_banned", {
      count: "exact",
    })
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description={`Consumer accounts — ${total} total`}
      />

      <AdminUsersTable users={users ?? []} />

      <AdminPagination basePath="/lex/auth/users" total={total} page={page} />
    </div>
  );
}
