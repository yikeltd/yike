import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader, StatusBadge } from "@/components/admin/dashboard/admin-ui";

export default async function AuditLogsPage() {
  const supabase = createAdminClient();

  const { data: logs } = supabase
    ? await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit logs"
        description="Sensitive admin actions — last 100 entries"
      />

      {!logs?.length ? (
        <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
          No audit entries yet. Actions requiring admin PIN will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy/5 bg-surface/80">
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Time</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Action</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Role</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-NG")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy">{log.action}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.actor_role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {log.target_type ?? "—"}
                    {log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
