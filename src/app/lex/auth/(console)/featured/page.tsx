import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { FeaturedListingControls } from "@/components/admin/featured-listing-controls";
import { YikeVerifiedControls } from "@/components/admin/yike-verified-controls";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { formatPrice } from "@/lib/utils";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { Property } from "@/types/database";
import Link from "next/link";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { PROMOTIONS_SECTION_TABS } from "@/lib/admin/navigation";
import { listingPath } from "@/lib/marketplace/listing-path";
import { normalizeAssetType } from "@/lib/marketplace/listings";

export default async function AdminFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; vertical?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const vertical =
    sp.vertical === "vehicle"
      ? "vehicle"
      : sp.vertical === "property"
        ? "property"
        : "all";
  const supabase = await requireServerClient();

  let featuredQuery = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", true)
    .order("featured_created_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (vertical === "vehicle") featuredQuery = featuredQuery.eq("asset_type", "VEHICLE");
  if (vertical === "property") {
    featuredQuery = featuredQuery.or("asset_type.eq.PROPERTY,asset_type.is.null");
  }

  const { data, count } = await featuredQuery;

  let candidatesQuery = supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .eq("is_featured", false)
    .order("views_count", { ascending: false })
    .limit(10);
  if (vertical === "vehicle") candidatesQuery = candidatesQuery.eq("asset_type", "VEHICLE");
  if (vertical === "property") {
    candidatesQuery = candidatesQuery.or("asset_type.eq.PROPERTY,asset_type.is.null");
  }
  const { data: candidates } = await candidatesQuery;

  const total = count ?? 0;

  return (
    <div className="space-y-8">
      <AdminSectionTabs tabs={PROMOTIONS_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Featured listings</h1>
        <p className="text-sm text-muted">
          {total} promoted · active featured rank first in search and browse
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
                  ? "/lex/auth/featured"
                  : `/lex/auth/featured?vertical=${key}`
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
        <ul className="mt-4 space-y-4">
          {(data ?? []).map((p) => {
            const property = p as Property;
            const active = isFeaturedActive(property);
            const isVehicle = normalizeAssetType(property.asset_type) === "VEHICLE";
            return (
              <li
                key={property.id}
                className="rounded-xl border border-border bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                        {isVehicle ? "Vehicle" : "Property"}
                      </span>
                      <Link
                        href={listingPath(property)}
                        className="text-xs font-medium text-muted hover:text-navy"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Public →
                      </Link>
                    </div>
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
                      · {property.area || property.city}
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
            const isVehicle = normalizeAssetType(property.asset_type) === "VEHICLE";
            return (
              <li
                key={property.id}
                className="rounded-lg border border-border px-4 py-3"
              >
                <p className="text-xs font-bold uppercase text-muted">
                  {isVehicle ? "Vehicle" : "Property"}
                </p>
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
