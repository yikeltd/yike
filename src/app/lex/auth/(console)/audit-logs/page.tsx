import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminAuditLogsBoard } from "@/components/admin/admin-audit-logs-board";
import { fetchAuditLogs } from "@/lib/admin/audit-query";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = createAdminClient();

  const { logs, total } = supabase
    ? await fetchAuditLogs(supabase, { page, pageSize: to - from + 1 })
    : { logs: [], total: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit logs"
        description={`Operational accountability — ${total} entries. Every important staff action is logged with actor, reason, and risk level.`}
      />

      <AdminAuditLogsBoard initialLogs={logs} initialTotal={total} page={page} />
    </div>
  );
}
