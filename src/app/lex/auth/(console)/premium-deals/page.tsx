import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";
import Link from "next/link";

export default async function AdminPremiumDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const { data, count } = await admin
    .from("properties")
    .select("*", { count: "exact" })
    .or("is_premium_deal.eq.true,closing_tracking_enabled.eq.true")
    .order("updated_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  const rows = (data ?? []) as Property[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Premium deals</h1>
        <p className="text-sm text-muted">
          Internal closing-tracked listings — commission fields never shown publicly
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-surface/50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Premium</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Commission rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-surface">
                <td className="px-4 py-3">
                  <Link
                    href={`/lex/auth/listings/${p.id}`}
                    className="font-medium text-navy hover:text-gold-dark"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {p.area}, {p.city}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatPrice(Number(p.price), p.payment_period, p.listing_type)}
                </td>
                <td className="px-4 py-3">{p.is_premium_deal ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  {p.closing_tracking_enabled ? "Enabled" : "—"}
                </td>
                <td className="px-4 py-3">
                  {p.expected_commission_rate != null
                    ? `${(Number(p.expected_commission_rate) * 100).toFixed(2)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">
            No premium deals flagged yet. Edit a listing in Command Center to enable
            tracking.
          </p>
        )}
      </div>

      <AdminPagination
        basePath="/lex/auth/premium-deals"
        total={total}
        page={page}
      />
    </div>
  );
}
