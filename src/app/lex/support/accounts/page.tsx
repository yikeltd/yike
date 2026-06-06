import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function SupportAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();
  const { data, count } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, phone_verified, email_verified, is_banned, created_at", {
      count: "exact",
    })
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Account support" description={`${total} user accounts — read only`} />
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">User</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Phone</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">{u.phone ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {u.phone_verified ? "Phone ✓" : "Phone ✗"} · {u.email_verified ? "Email ✓" : "Email ✗"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination basePath="/lex/support/accounts" total={total} page={page} />
    </div>
  );
}
