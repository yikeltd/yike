import Link from "next/link";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { propertyPath } from "@/lib/property-url";
import { daysUntilExpiry } from "@/lib/listing-lifecycle";
import type { Property } from "@/types/database";
import { offsetDaysIso } from "@/lib/time";

export default async function ExpiringListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const withinDays = Math.min(14, Math.max(1, Number(sp.days) || 7));
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const now = new Date().toISOString();
  const cutoff = offsetDaysIso(withinDays);

  const { data, count } = await supabase
    .from("properties")
    .select("id, title, city, area, slug, expires_at, agent_id, status", {
      count: "exact",
    })
    .eq("status", "approved")
    .gt("expires_at", now)
    .lte("expires_at", cutoff)
    .order("expires_at", { ascending: true })
    .range(from, to);

  const total = count ?? 0;
  const rows = (data ?? []) as Pick<
    Property,
    "id" | "title" | "city" | "area" | "slug" | "expires_at" | "agent_id" | "status"
  >[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Expiring listings"
        description={`Approved listings expiring within ${withinDays} days`}
      />

      <div className="flex flex-wrap gap-2 text-sm">
        {[3, 7, 14].map((d) => (
          <Link
            key={d}
            href={`/lex/auth/expiring-listings?days=${d}`}
            className={`rounded-full px-3 py-1 font-semibold ${
              withinDays === d
                ? "bg-navy text-white"
                : "border border-border bg-white text-navy"
            }`}
          >
            {d} days
          </Link>
        ))}
      </div>

      <ul className="space-y-3">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4"
          >
            <div className="min-w-0">
              <Link href={propertyPath(p)} className="font-semibold text-navy">
                {p.title}
              </Link>
              <p className="text-xs text-muted">
                {p.city} · {p.area} · expires in {daysUntilExpiry(p)} day
                {daysUntilExpiry(p) === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href={`/lex/auth/listings/${p.id}`}
              className="text-xs font-bold text-gold-dark"
            >
              Admin edit
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted">No listings expiring in this window.</p>
        )}
      </ul>

      <AdminPagination
        basePath="/lex/auth/expiring-listings"
        total={total}
        page={page}
        params={{ days: String(withinDays) }}
      />
    </div>
  );
}
