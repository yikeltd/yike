import Link from "next/link";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";

export default async function PricingWarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data, count } = await supabase
    .from("properties")
    .select(
      "id, title, city, area, price, price_anomaly_level, price_review_status, price_anomaly_reason, status",
      { count: "exact" }
    )
    .in("price_review_status", ["admin_review", "needs_confirmation"])
    .order("updated_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as Pick<
    Property,
    | "id"
    | "title"
    | "city"
    | "area"
    | "price"
    | "price_anomaly_level"
    | "price_review_status"
    | "price_anomaly_reason"
    | "status"
  >[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pricing warnings"
        description="Soft anomaly flags — admin decides, never auto-reject"
      />
      <ul className="space-y-3">
        {rows.map((p) => (
          <li key={p.id} className="rounded-xl border border-border bg-white p-4">
            <Link href={`/lex/auth/listings/${p.id}`} className="font-semibold text-navy">
              {p.title}
            </Link>
            <p className="text-xs text-muted">
              {p.city} · {p.area} · {formatPrice(Number(p.price))} · {p.status}
            </p>
            <p className="mt-1 text-sm text-muted">
              {p.price_anomaly_reason ?? p.price_anomaly_level}
            </p>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted">No active pricing warnings.</p>
        )}
      </ul>
      <AdminPagination
        basePath="/lex/auth/pricing-warnings"
        total={count ?? 0}
        page={page}
      />
    </div>
  );
}
