import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { FeaturedListingControls } from "@/components/admin/featured-listing-controls";
import { YikeVerifiedControls } from "@/components/admin/yike-verified-controls";
import { isFeaturedActive } from "@/lib/agent-tiers";
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
    .order("featured_created_at", { ascending: false, nullsFirst: false })
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
        <p className="text-sm text-muted">
          {total} promoted · active featured rank first in search and browse
        </p>
        <ul className="mt-4 space-y-4">
          {(data ?? []).map((p) => {
            const property = p as Property;
            const active = isFeaturedActive(property);
            return (
              <li
                key={property.id}
                className="rounded-xl border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                    {!active && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Expired — not ranking as featured
                      </p>
                    )}
                  </div>
                </div>
                <FeaturedListingControls property={property} />
                <YikeVerifiedControls property={property} />
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
        <p className="text-sm text-muted">
          Manual promotion only — payment handled offline for launch.
        </p>
        <ul className="mt-4 space-y-4">
          {(candidates ?? []).map((p) => {
            const property = p as Property;
            return (
              <li
                key={property.id}
                className="rounded-lg border border-border px-4 py-3"
              >
                <p className="text-sm font-medium">{property.title}</p>
                <FeaturedListingControls property={property} compact />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
