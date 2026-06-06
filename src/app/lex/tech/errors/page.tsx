import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function TechErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = createAdminClient();
  const { data: logs, count } = supabase
    ? await supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)
    : { data: [], count: 0 };

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Error logs" description={`${total} system events from audit trail`} />
      <div className="space-y-2">
        {(logs ?? []).map((log) => (
          <div key={log.id} className="rounded-xl border border-navy/10 bg-white px-4 py-3 font-mono text-xs">
            {log.action} · {new Date(log.created_at).toLocaleString("en-NG")}
          </div>
        ))}
      </div>
      <AdminPagination basePath="/lex/tech/errors" total={total} page={page} />
    </div>
  );
}
