import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ListingModerationActions } from "@/components/admin/trust-quality-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import type { Property } from "@/types/database";

export default async function SupportModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "flagged";
  const { page, from } = parseAdminPage(params);
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const statuses =
    status === "pending"
      ? ["pending"]
      : status === "all"
        ? ["pending", "flagged"]
        : ["flagged"];

  const { data, count } = await admin
    .from("properties")
    .select(
      "id, title, city, area, status, moderation_note, listing_health_score, possible_duplicate, created_at",
      { count: "exact" }
    )
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  const total = count ?? 0;
  const rows = (data ?? []) as Property[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Moderation Queue</h1>
        <p className="text-sm text-muted">
          Review flagged and pending listings · {total} in queue
        </p>
      </div>

      <form method="get" className="flex gap-2 text-sm">
        {[
          { value: "flagged", label: "Flagged" },
          { value: "pending", label: "Pending" },
          { value: "all", label: "All" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="submit"
            name="status"
            value={opt.value}
            className={`rounded-lg px-3 py-2 font-semibold ${
              status === opt.value
                ? "bg-navy text-white"
                : "border border-navy/15 text-navy"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </form>

      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-sm text-muted">
            Queue is clear for this filter.
          </li>
        )}
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={propertyPath(row)}
                  className="font-semibold text-navy hover:underline"
                >
                  {row.title}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {row.area}, {row.city} · {row.status}
                  {row.listing_health_score != null &&
                    ` · Health ${row.listing_health_score}`}
                  {row.possible_duplicate && " · Possible duplicate"}
                </p>
                {row.moderation_note && (
                  <p className="mt-2 text-xs text-amber-900">{row.moderation_note}</p>
                )}
              </div>
              <ListingModerationActions listingId={row.id} status={row.status} />
            </div>
          </li>
        ))}
      </ul>

      <AdminPagination
        basePath="/lex/support/moderation"
        total={total}
        page={page}
        params={{ status }}
      />
    </div>
  );
}
