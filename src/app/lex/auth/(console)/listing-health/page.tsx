import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { TrustQualityBatchButton } from "@/components/admin/trust-quality-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import { listingPath } from "@/lib/marketplace/listing-path";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import type { Property } from "@/types/database";

export default async function AdminListingHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; vertical?: string }>;
}) {
  const params = await searchParams;
  const { page, from } = parseAdminPage(params);
  const vertical =
    params.vertical === "vehicle"
      ? "vehicle"
      : params.vertical === "property"
        ? "property"
        : "all";
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  let query = admin
    .from("properties")
    .select(
      "id, title, city, area, status, slug, asset_type, listing_health_score, listing_quality_flags, listing_activity_status",
      { count: "exact" }
    )
    .eq("status", "approved")
    .not("listing_health_score", "is", null)
    .lte("listing_health_score", 65)
    .order("listing_health_score", { ascending: true })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (vertical === "vehicle") query = query.eq("asset_type", "VEHICLE");
  if (vertical === "property") {
    query = query.or("asset_type.eq.PROPERTY,asset_type.is.null");
  }

  const { data, count } = await query;

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
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {(
              [
                ["all", "All"],
                ["property", "Property"],
                ["vehicle", "Vehicles"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={
                  key === "all"
                    ? "/lex/auth/listing-health"
                    : `/lex/auth/listing-health?vertical=${key}`
                }
                className={
                  vertical === key
                    ? "rounded-full bg-navy px-3 py-1 text-white"
                    : "rounded-full border border-navy/15 px-3 py-1 text-navy"
                }
              >
                {label}
              </Link>
            ))}
          </div>
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
          const isVehicle = normalizeAssetType(row.asset_type) === "VEHICLE";
          return (
            <li
              key={row.id}
              className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
            >
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                {isVehicle ? "Vehicle" : "Property"}
              </div>
              <Link
                href={listingPath(row)}
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
              <Link
                href={`/lex/auth/listings/${row.id}`}
                className="mt-2 inline-block text-xs font-semibold text-gold-dark"
              >
                Moderate in Lex →
              </Link>
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
