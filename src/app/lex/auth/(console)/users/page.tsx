import { requireSuperAdmin } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  const supabase = await requireServerClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at, is_banned")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Consumer accounts — read-only overview"
      />

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/5 bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Name</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Email</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-navy">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(u.created_at).toLocaleDateString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
