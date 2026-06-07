import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";
import { ResolveReportButton } from "./resolve-button";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import type { Property } from "@/types/database";
import { OPEN_REPORT_STATUSES } from "@/lib/constants";

const STATUS_TABS = [
  { id: "open", label: "Open" },
  { id: "reviewed", label: "Reviewed" },
  { id: "action_taken", label: "Action taken" },
  { id: "dismissed", label: "Dismissed" },
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "open";
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data, count } = await supabase
    .from("listing_reports")
    .select(`*, property:properties (id, title, area, city, slug)`, {
      count: "exact",
    })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted">{total} {status} reports</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.id}
            href={`/lex/auth/reports?status=${tab.id}`}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              status === tab.id
                ? "bg-navy text-white"
                : "border border-border bg-white text-navy"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>
      {OPEN_REPORT_STATUSES.includes(status as (typeof OPEN_REPORT_STATUSES)[number]) && (
        <p className="text-xs text-muted">
          3+ unresolved reports flag a listing for review; 5+ recommend a soft hold.
        </p>
      )}
      <ul className="space-y-4">
        {(data ?? []).map((r) => {
          const prop = r.property as Property | null;
          const href = prop ? propertyPath(prop) : `/properties/${r.property_id}`;
          return (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <p className="font-semibold">{r.reason}</p>
              <p className="text-sm text-muted">{r.message}</p>
              <p className="text-sm">
                Listing:{" "}
                <Link href={href} className="text-primary">
                  {prop?.title ?? r.property_id}
                </Link>
                {prop && (
                  <>
                    {" · "}
                    <Link
                      href={`/lex/auth/listings/${prop.id}`}
                      className="text-xs text-gold-dark"
                    >
                      Edit in admin
                    </Link>
                  </>
                )}
              </p>
              <p className="text-xs text-muted">
                {r.reporter_name} · {r.reporter_phone}
              </p>
              <div className="mt-3">
                <ResolveReportButton reportId={r.id} />
              </div>
            </li>
          );
        })}
      </ul>
      <AdminPagination
        basePath="/lex/auth/reports"
        total={total}
        page={page}
        params={{ status }}
      />
    </div>
  );
}
