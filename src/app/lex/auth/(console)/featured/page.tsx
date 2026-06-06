import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingActions } from "@/components/admin/listing-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { FeaturedBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { Property } from "@/types/database";
import Link from "next/link";

export default async function AdminFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data, count } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: candidates } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .eq("is_featured", false)
    .order("views_count", { ascending: false })
    .limit(10);

  const total = count ?? 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Featured listings</h1>
        <p className="text-sm text-muted">{total} featured</p>
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((p) => {
            const property = p as Property;
            return (
              <li
                key={property.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
              >
                <div>
                  <Link
                    href={`/lex/auth/listings/${property.id}`}
                    className="font-semibold text-navy hover:text-gold-dark"
                  >
                    {property.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatPrice(
                      Number(property.price),
                      property.payment_period,
                      property.listing_type
                    )}{" "}
                    · {property.area}
                  </p>
                </div>
                <FeaturedBadge />
                <ListingActions propertyId={property.id} compact />
              </li>
            );
          })}
        </ul>
        <AdminPagination
          basePath="/lex/auth/featured"
          total={total}
          page={page}
          className="mt-4"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Candidates (top views)</h2>
        <ul className="mt-4 space-y-2">
          {(candidates ?? []).map((p) => {
            const property = p as Property;
            return (
              <li
                key={property.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2"
              >
                <span className="text-sm">{property.title}</span>
                <ListingActions propertyId={property.id} compact />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
