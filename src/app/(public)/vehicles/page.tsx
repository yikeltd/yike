import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { MarketplaceVerticalSwitcher } from "@/components/marketplace/vertical-switcher";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { MarketplaceSafetyNotice } from "@/components/marketplace/safety-notice";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { isFeaturedActive } from "@/lib/agent-tiers";

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

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();

  const sp = await searchParams;
  const sort = first(sp.sort) || "newest";
  const page = Math.max(1, Number(first(sp.page) || "1") || 1);
  const supabase = await createClient();
  let vehicles = supabase
    ? await queryPublicVehicles(supabase, {
        q: first(sp.q),
        state: first(sp.state),
        city: first(sp.city),
        auto_category: first(sp.category),
        make: first(sp.make),
        min_price: first(sp.min_price) ? Number(first(sp.min_price)) : undefined,
        max_price: first(sp.max_price) ? Number(first(sp.max_price)) : undefined,
        transmission: first(sp.transmission),
        fuel_type: first(sp.fuel),
        condition: first(sp.condition),
        limit: 120,
      })
    : [];

  if (sort === "price_asc") {
    vehicles = [...vehicles].sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price_desc") {
    vehicles = [...vehicles].sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "featured") {
    vehicles = [...vehicles].sort(
      (a, b) => Number(isFeaturedActive(b)) - Number(isFeaturedActive(a)),
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
    "min_price",
    "max_price",
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <header className="mb-6">
        <MarketplaceVerticalSwitcher active="vehicle" />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gold">Yike Marketplace</p>
            <h1 className="text-3xl font-bold text-navy">Vehicles</h1>
            <p className="mt-1 max-w-xl text-sm text-black/60">
              Cars, SUVs, trucks, motorcycles, commercial vehicles, and more —
              reviewed before going live.
            </p>
          </div>
          <SaveSearchButton label={saveLabel} href={saveHref} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/agent/listings/new/vehicle"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy"
          >
            Sell a vehicle
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-navy/15 px-4 py-2 text-sm text-navy"
          >
            Browse property
          </Link>
        </div>
      </header>

      <form className="mb-4 grid gap-2 rounded-xl border border-black/8 bg-white p-3 sm:grid-cols-6">
        <input
          name="q"
          defaultValue={first(sp.q) ?? ""}
          placeholder="Search make, model…"
          className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2"
        />
        <select
          name="category"
          defaultValue={first(sp.category) ?? ""}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.plural}
            </option>
          ))}
        </select>
        <select
          name="condition"
          defaultValue={first(sp.condition) ?? ""}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="">Any condition</option>
          <option value="new">New</option>
          <option value="foreign_used">Foreign used</option>
          <option value="nigerian_used">Nigerian used</option>
          <option value="certified">Certified</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="newest">Newest / featured</option>
          <option value="featured">Featured first</option>
          <option value="price_asc">Price · low to high</option>
          <option value="price_desc">Price · high to low</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white"
        >
          Apply
        </button>
      </form>

      <div className="mb-6">
        <MarketplaceSafetyNotice vertical="vehicle" />
      </div>

      {featured.length > 0 && sort !== "price_asc" && sort !== "price_desc" ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-navy">Featured vehicles</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <li key={`feat-${v.id}`}>
                <VehicleCard vehicle={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pageSlice.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-navy">No vehicles match</p>
          <p className="mt-1 text-sm text-black/55">
            Try fewer filters, or be the first to list in this category.
          </p>
          <Link
            href="/agent/listings/new/vehicle"
            className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy"
          >
            List a vehicle
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
            {Math.min(pageSafe * PAGE_SIZE, total)} of {total}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm text-navy"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-muted">
                Page {pageSafe} / {totalPages}
              </span>
              {pageSafe < totalPages ? (
                <Link
                  href={pageHref(pageSafe + 1)}
                  className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm text-navy"
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
