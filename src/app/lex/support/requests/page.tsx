import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader, StatusBadge } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function SupportRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();
  const { data, count } = await supabase
    .from("property_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Contact messages" description={`${total} property requests and inquiries`} />
      <div className="space-y-3">
        {(data ?? []).map((req) => (
          <article key={req.id} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-navy">{req.contact_name ?? "Anonymous"}</p>
              <StatusBadge status={req.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{req.city} · {req.budget_range ?? "No budget"}</p>
            <p className="mt-2 text-sm">{req.notes ?? req.requirements}</p>
            <p className="mt-2 text-xs text-muted">{req.contact_phone} · {req.contact_email}</p>
          </article>
        ))}
      </div>
      <AdminPagination basePath="/lex/support/requests" total={total} page={page} />
    </div>
  );
}
