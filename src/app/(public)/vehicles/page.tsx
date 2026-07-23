import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { POPULAR_VEHICLE_MAKES } from "@/lib/marketplace/vehicle-makes";
import { NIGERIAN_STATES } from "@/lib/constants";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import { MarketplaceEmptyState } from "@/components/marketplace/marketplace-empty-state";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { MarketplaceSafetyNotice } from "@/components/marketplace/safety-notice";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";

export const metadata: Metadata = {
  title: "Vehicles | Yike Marketplace",
  description: "Buy cars, SUVs, trucks, and more on Yike — Nigeria’s marketplace.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const PAGE_SIZE = 24;
const YEAR_NOW = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => YEAR_NOW - i);

const controlClass =
  "min-h-12 w-full rounded-xl border border-navy/12 bg-white px-3.5 text-base text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

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
  const supabase = await createClient();
  let vehicles = supabase
    ? await queryPublicVehicles(supabase, {
        q: first(sp.q),
        state: first(sp.state),
        city: first(sp.city),
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
        condition: first(sp.condition),
        limit: 48,
      })
    : [];

  const vehicleDemo = withEmptyInventoryDemoFixtures(vehicles, "vehicle", 24);
  vehicles = vehicleDemo.items;

  if (sort === "price_asc") {
    vehicles = [...vehicles].sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price_desc") {
    vehicles = [...vehicles].sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "featured") {
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

  const featured = vehicles.filter((v) => isFeaturedActive(v)).slice(0, 6);
  const total = vehicles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = vehicles.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

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
  ] as const) {
    const v = first(sp[key]);
    if (v) qs.set(key, v);
  }
  const saveHref = qs.toString() ? `/vehicles?${qs.toString()}` : "/vehicles";
  const saveLabel = [
    "Vehicles",
    first(sp.category),
    first(sp.make),
    first(sp.q),
    first(sp.city),
  ]
    .filter(Boolean)
    .join(" · ");

  function pageHref(p: number) {
    const next = new URLSearchParams(qs);
    if (p > 1) next.set("page", String(p));
    const s = next.toString();
    return s ? `/vehicles?${s}` : "/vehicles";
  }

  const hasFilters = Boolean(
    first(sp.q) ||
      first(sp.category) ||
      first(sp.condition) ||
      first(sp.make) ||
      first(sp.model) ||
      first(sp.state) ||
      first(sp.city) ||
      first(sp.min_year) ||
      first(sp.max_year) ||
      first(sp.min_price) ||
      first(sp.max_price),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 pb-24">
      <MarketplaceCategoryHeader
        vertical="vehicle"
        title="Vehicles"
        tagline="Find your next vehicle."
        sellHref="/agent/listings/new/vehicle"
        sellLabel="Sell Vehicle"
        saveLabel={saveLabel}
        saveHref={saveHref}
      />

      <form className="mb-5 space-y-3 rounded-2xl border border-navy/8 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="q"
            defaultValue={first(sp.q) ?? ""}
            placeholder="Search make, model…"
            className={`${controlClass} lg:col-span-2`}
            aria-label="Search vehicles"
          />
          <select
            name="category"
            defaultValue={first(sp.category) ?? ""}
            className={controlClass}
            aria-label="Category"
          >
            <option value="">Category</option>
            {VEHICLE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.plural}
              </option>
            ))}
          </select>
          <select
            name="condition"
            defaultValue={first(sp.condition) ?? ""}
            className={controlClass}
            aria-label="Condition"
          >
            <option value="">Condition</option>
            <option value="new">New</option>
            <option value="foreign_used">Foreign used</option>
            <option value="nigerian_used">Nigerian used</option>
            <option value="certified">Certified</option>
          </select>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <select
            name="make"
            defaultValue={first(sp.make) ?? ""}
            className={controlClass}
            aria-label="Make"
          >
            <option value="">Make</option>
            {POPULAR_VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            name="model"
            defaultValue={first(sp.model) ?? ""}
            placeholder="Model"
            className={controlClass}
            aria-label="Model"
          />
          <select
            name="min_year"
            defaultValue={first(sp.min_year) ?? ""}
            className={controlClass}
            aria-label="Year from"
          >
            <option value="">Year from</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            name="state"
            defaultValue={first(sp.state) ?? ""}
            className={controlClass}
            aria-label="Location"
          >
            <option value="">Location</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="min_price"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={first(sp.min_price) ?? ""}
            placeholder="Min price (₦)"
            className={controlClass}
            aria-label="Minimum price"
          />
          <input
            name="max_price"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={first(sp.max_price) ?? ""}
            placeholder="Max price (₦)"
            className={controlClass}
            aria-label="Maximum price"
          />
          <select
            name="sort"
            defaultValue={sort}
            className={controlClass}
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="featured">Featured</option>
            <option value="price_asc">Price · low to high</option>
            <option value="price_desc">Price · high to low</option>
          </select>
          <button
            type="submit"
            className="pressable min-h-12 rounded-xl bg-navy px-4 text-base font-bold text-white"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mb-5">
        <MarketplaceSafetyNotice vertical="vehicle" />
      </div>

      {featured.length > 0 && sort !== "price_asc" && sort !== "price_desc" ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-navy">Featured</h2>
          <ul className={BROWSE_GRID_CLASS}>
            {featured.map((v) => (
              <li key={`feat-${v.id}`}>
                <VehicleCard vehicle={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pageSlice.length === 0 ? (
        <MarketplaceEmptyState
          title={hasFilters ? "No Vehicles Match" : "No Vehicles Yet"}
          subtitle={
            hasFilters
              ? "Try fewer filters, or list one yourself."
              : "Be the first to list one."
          }
          actionHref="/agent/listings/new/vehicle"
          actionLabel="Sell Vehicle"
          secondaryHref={hasFilters ? "/vehicles" : undefined}
          secondaryLabel={hasFilters ? "Clear filters" : undefined}
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            {total} {total === 1 ? "vehicle" : "vehicles"}
          </p>
          <ul className={BROWSE_GRID_CLASS}>
            {pageSlice.map((v) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} />
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
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
    </main>
  );
}
