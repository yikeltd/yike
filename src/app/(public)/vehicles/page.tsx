import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";
import { VehicleSearchResultsChrome } from "@/components/marketplace/vehicle-search-results-chrome";
import {
  QuickFilterChips,
  VEHICLE_QUICK_FILTERS,
  DiscoveryEmptyPanel,
} from "@/components/marketplace/experience";
import { getServerSearchPreferences } from "@/lib/search-preferences";
import { PrefSync } from "@/components/personalization/pref-sync";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Vehicles",
  description: `Search cars, SUVs, trucks and more across Nigeria on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/vehicles` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const PAGE_SIZE = 24;

const USED_CONDITIONS = new Set([
  "used",
  "nigerian_used",
  "foreign_used",
  "certified",
]);

function ResultsFallback() {
  return (
    <div className="space-y-3 px-3 pt-2">
      <div className="skeleton h-14 w-full rounded-xl" />
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();

  const sp = await searchParams;
  const sort = first(sp.sort) || "newest";
  const page = Math.max(1, Number(first(sp.page) || "1") || 1);
  const minYear = first(sp.min_year) ? Number(first(sp.min_year)) : undefined;
  const maxYear = first(sp.max_year) ? Number(first(sp.max_year)) : undefined;
  const maxMileage = first(sp.max_mileage)
    ? Number(first(sp.max_mileage))
    : undefined;
  const conditionParam = first(sp.condition);
  const verifiedOnly = first(sp.verified) === "1";
  const featuredOnly = first(sp.featured) === "1";
  const nearbyFlag = first(sp.nearby) === "1";

  let city = first(sp.city);
  let state = first(sp.state);
  if (nearbyFlag && !city && !state) {
    const prefs = await getServerSearchPreferences();
    city = prefs.city;
    state = prefs.state;
  }

  const queryCondition =
    conditionParam && conditionParam !== "used" ? conditionParam : undefined;

  const supabase = await createClient();
  let vehicles = supabase
    ? await queryPublicVehicles(supabase, {
        q: first(sp.q),
        state,
        city,
        auto_category: first(sp.category),
        make: first(sp.make),
        model: first(sp.model),
        min_year: Number.isFinite(minYear) ? minYear : undefined,
        max_year: Number.isFinite(maxYear) ? maxYear : undefined,
        min_price: first(sp.min_price) ? Number(first(sp.min_price)) : undefined,
        max_price: first(sp.max_price) ? Number(first(sp.max_price)) : undefined,
        max_mileage: Number.isFinite(maxMileage) ? maxMileage : undefined,
        transmission: first(sp.transmission),
        fuel_type: first(sp.fuel),
        condition: queryCondition,
        featured: featuredOnly || undefined,
        limit: 48,
      })
    : [];

  if (conditionParam === "used") {
    vehicles = vehicles.filter((v) =>
      USED_CONDITIONS.has(String(v.vehicle_condition ?? "").toLowerCase()),
    );
  }
  if (verifiedOnly) {
    vehicles = vehicles.filter((v) => Boolean(v.is_verified_listing));
  }

  const vehicleDemo = withEmptyInventoryDemoFixtures(vehicles, "vehicle", 24);
  vehicles = vehicleDemo.items;

  if (sort === "price_asc") {
    vehicles = [...vehicles].sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price_desc") {
    vehicles = [...vehicles].sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "featured" || featuredOnly) {
    vehicles = [...vehicles].sort(
      (a, b) => Number(isFeaturedActive(b)) - Number(isFeaturedActive(a)),
    );
  } else if (sort === "mileage" || first(sp.max_mileage)) {
    vehicles = [...vehicles].sort(
      (a, b) =>
        (Number(a.mileage) || Number.POSITIVE_INFINITY) -
        (Number(b.mileage) || Number.POSITIVE_INFINITY),
    );
  } else {
    vehicles = [...vehicles].sort(
      (a, b) =>
        Number(isFeaturedActive(b)) - Number(isFeaturedActive(a)) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  const total = vehicles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = vehicles.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  const qs = new URLSearchParams();
  for (const key of [
    "q",
    "category",
    "condition",
    "sort",
    "state",
    "city",
    "make",
    "model",
    "min_year",
    "max_year",
    "min_price",
    "max_price",
    "max_mileage",
    "transmission",
    "fuel",
    "verified",
    "featured",
    "nearby",
  ] as const) {
    const v = first(sp[key]);
    if (v) qs.set(key, v);
  }
  function pageHref(p: number) {
    const next = new URLSearchParams(qs);
    if (p > 1) next.set("page", String(p));
    const s = next.toString();
    return s ? `/vehicles?${s}` : "/vehicles";
  }

  const hasFilters = Boolean(
    first(sp.q) ||
      first(sp.category) ||
      conditionParam ||
      first(sp.make) ||
      first(sp.model) ||
      state ||
      city ||
      first(sp.min_year) ||
      first(sp.max_year) ||
      first(sp.min_price) ||
      first(sp.max_price) ||
      verifiedOnly ||
      featuredOnly ||
      nearbyFlag,
  );

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] lg:pb-8">
      <PrefSync />
      <div className="px-3 pt-4 lg:px-6 xl:px-8">
        <MarketplaceCategoryHeader
          vertical="vehicle"
          title="Vehicles"
          className="mb-2"
        />
        <Suspense fallback={null}>
          <div className="mb-3">
            <QuickFilterChips
              chips={VEHICLE_QUICK_FILTERS}
              basePath="/vehicles"
            />
          </div>
        </Suspense>
      </div>

      <Suspense fallback={<ResultsFallback />}>
        <VehicleSearchResultsChrome
          resultCount={total}
          filtersDefaultOpen={false}
        >
          <section className="mt-1 w-full px-3 lg:px-6 xl:px-8">
            {pageSlice.length === 0 ? (
              <DiscoveryEmptyPanel
                category="vehicle"
                title={hasFilters ? "No vehicles match" : "Start exploring vehicles"}
                subtitle={
                  hasFilters
                    ? "Try another filter, or browse popular categories below."
                    : "Recent searches, trending makes, and cities — tap to browse."
                }
                showLatestHref="/vehicles"
              />
            ) : (
              <>
                <ul className={BROWSE_GRID_CLASS}>
                  {pageSlice.map((v) => (
                    <li key={v.id}>
                      <VehicleCard vehicle={v} variant="browse" />
                    </li>
                  ))}
                </ul>
                {totalPages > 1 ? (
                  <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 pb-6">
                    {pageSafe > 1 ? (
                      <Link
                        href={pageHref(pageSafe - 1)}
                        className="rounded-xl border border-navy/15 px-3 py-2 text-sm font-semibold text-navy"
                      >
                        Previous
                      </Link>
                    ) : null}
                    <span className="text-sm text-muted">
                      {pageSafe} / {totalPages}
                    </span>
                    {pageSafe < totalPages ? (
                      <Link
                        href={pageHref(pageSafe + 1)}
                        className="rounded-xl border border-navy/15 px-3 py-2 text-sm font-semibold text-navy"
                      >
                        Next
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </>
            )}
          </section>
        </VehicleSearchResultsChrome>
      </Suspense>
    </div>
  );
}
