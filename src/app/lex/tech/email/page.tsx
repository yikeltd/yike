import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function TechEmailPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Email status (Resend)" description="Recent delivery logs" />
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Email</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Type</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
                <td className="px-4 py-3 text-xs">{row.type}</td>
                <td className="px-4 py-3 text-xs">{row.status}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
