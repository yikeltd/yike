import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ResolveReportButton } from "@/app/lex/auth/(console)/reports/resolve-button";
import { parseAdminPage } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import type { Property } from "@/types/database";

export default async function SupportReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();
  const { data, count } = await supabase
    .from("listing_reports")
    .select(`*, property:properties (id, title, area, city, slug)`, { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Listing reports" description={`${total} open reports`} />
      <div className="space-y-3">
        {(data ?? []).map((r) => {
          const prop = r.property as Property | null;
          const href = prop ? propertyPath(prop) : `/properties/${r.property_id}`;
          return (
            <article key={r.id} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
              <p className="font-semibold text-navy">{r.reason}</p>
              <p className="mt-1 text-sm text-muted">{r.message}</p>
              <p className="mt-2 text-sm">
                Listing:{" "}
                <Link href={href} className="text-gold-dark">
                  {prop?.title ?? r.property_id}
                </Link>
              </p>
              <p className="text-xs text-muted">{r.reporter_name} · {r.reporter_phone}</p>
              <div className="mt-3">
                <ResolveReportButton reportId={r.id} />
              </div>
            </article>
          );
        })}
        {(data ?? []).length === 0 && (
          <p className="text-sm text-muted">No open reports</p>
        )}
      </div>
      <AdminPagination basePath="/lex/support/reports" total={total} page={page} />
    </div>
  );
}
