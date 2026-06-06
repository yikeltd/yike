import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function TechErrorsPage() {
  const supabase = createAdminClient();
  const { data: logs } = supabase
    ? await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Error logs" description="Recent system events from audit trail" />
      <div className="space-y-2">
        {(logs ?? []).map((log) => (
          <div key={log.id} className="rounded-xl border border-navy/10 bg-white px-4 py-3 font-mono text-xs">
            {log.action} · {new Date(log.created_at).toLocaleString("en-NG")}
          </div>
        ))}
      </div>
    </div>
  );
}
