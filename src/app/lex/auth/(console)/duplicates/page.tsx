import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { DuplicateScanButton } from "@/components/admin/trust-quality-controls";
import { ListingModerationActions } from "@/components/admin/trust-quality-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import type { Property } from "@/types/database";

export default async function AdminDuplicatesPage({
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
    .select("id, title, city, area, price, status, duplicate_group_id, duplicate_confidence_score, agent_id", {
      count: "exact",
    })
    .eq("possible_duplicate", true)
    .order("duplicate_confidence_score", { ascending: false, nullsFirst: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  const total = count ?? 0;
  const rows = (data ?? []) as Property[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Duplicate Flags</h1>
          <p className="text-sm text-muted">
            Internal similarity flags — review before action · {total} flagged
          </p>
        </div>
        <DuplicateScanButton />
      </div>

      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-sm text-muted">
            No duplicate flags yet. Run a scan to detect similar listings.
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
                  {row.area}, {row.city} · ₦{Number(row.price).toLocaleString()} ·{" "}
                  {Math.round((row.duplicate_confidence_score ?? 0) * 100)}% confidence
                </p>
                {row.duplicate_group_id && (
                  <p className="mt-1 font-mono text-[10px] text-muted">
                    Group {row.duplicate_group_id.slice(0, 8)}…
                  </p>
                )}
              </div>
              <ListingModerationActions listingId={row.id} status={row.status} />
            </div>
          </li>
        ))}
      </ul>

      <AdminPagination
        basePath="/lex/auth/duplicates"
        total={total}
        page={page}
      />
    </div>
  );
}
