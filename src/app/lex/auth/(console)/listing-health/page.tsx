import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { TrustQualityBatchButton } from "@/components/admin/trust-quality-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import type { Property } from "@/types/database";

export default async function AdminListingHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const { page, from } = parseAdminPage(params);
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const { data, count } = await admin
    .from("properties")
    .select(
      "id, title, city, area, status, listing_health_score, listing_quality_flags, listing_activity_status",
      { count: "exact" }
    )
    .eq("status", "approved")
    .not("listing_health_score", "is", null)
    .lte("listing_health_score", 65)
    .order("listing_health_score", { ascending: true })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  const total = count ?? 0;
  const rows = (data ?? []) as Property[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Listing Health</h1>
          <p className="text-sm text-muted">
            Low-quality approved listings · {total} need attention
          </p>
        </div>
        <TrustQualityBatchButton />
      </div>

      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-sm text-muted">
            No low-health listings in queue. Run recalculate to refresh scores.
          </li>
        )}
        {rows.map((row) => {
          const flags = Array.isArray(row.listing_quality_flags)
            ? (row.listing_quality_flags as string[])
            : [];
          return (
            <li
              key={row.id}
              className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
            >
              <Link
                href={propertyPath(row)}
                className="font-semibold text-navy hover:underline"
              >
                {row.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                {row.area}, {row.city} · Health {row.listing_health_score}/100 ·{" "}
                {row.listing_activity_status ?? "active"}
              </p>
              {flags.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {flags.slice(0, 6).map((flag) => (
                    <li
                      key={flag}
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
                    >
                      {flag.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <AdminPagination
        basePath="/lex/auth/listing-health"
        total={total}
        page={page}
      />
    </div>
  );
}
