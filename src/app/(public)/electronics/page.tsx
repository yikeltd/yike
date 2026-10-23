import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicElectronics } from "@/lib/marketplace/listings";
import { ElectronicsCard } from "@/components/marketplace/electronics-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";

export const metadata: Metadata = {
  title: "Electronics",
  description: `Buy phones, laptops, appliances, generators and more across Nigeria on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/electronics` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function ElectronicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isLaunchFeatureVisible("electronics_marketplace")) notFound();

  const sp = await searchParams;
  const supabase = await createClient();
  let items = supabase
    ? await queryPublicElectronics(supabase, {
        q: first(sp.q),
        state: first(sp.state),
        city: first(sp.city),
        auto_category: first(sp.category),
        brand: first(sp.brand),
        condition: first(sp.condition),
        min_price: first(sp.min_price) ? Number(first(sp.min_price)) : undefined,
        max_price: first(sp.max_price) ? Number(first(sp.max_price)) : undefined,
        limit: 48,
      })
    : [];

  return (
    <main className="min-h-screen bg-surface pb-24">
      <div className="px-3 pt-4 lg:px-6">
        <MarketplaceCategoryHeader vertical="electronics" title="Electronics" className="mb-2" />
      </div>

      <div className="mx-auto max-w-7xl px-3 py-4 lg:px-6">
        <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            name="q"
            defaultValue={first(sp.q) ?? ""}
            placeholder="Search brand, model, city…"
            className="flex-1 rounded-2xl border border-navy/15 px-4 py-3 text-sm"
          />
          <select
            name="category"
            defaultValue={first(sp.category) ?? ""}
            className="rounded-2xl border border-navy/15 px-3 py-3 text-sm"
          >
            <option value="">All categories</option>
            {ELECTRONICS_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl bg-navy px-5 py-3 text-sm font-bold text-white"
          >
            Search
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {ELECTRONICS_CATEGORIES.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/electronics?category=${c.id}`}
              className="rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/40"
            >
              {c.label}
            </Link>
          ))}
        </div>

        <Suspense fallback={<div className="skeleton h-40 w-full rounded-2xl" />}>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-10 text-center">
              <h2 className="text-lg font-bold text-navy">No electronics listings yet</h2>
              <p className="mt-2 text-sm text-muted">Try another filter or check back soon.</p>
              <Link
                href="/agent/listings/new/electronics"
                className="pressable mt-4 inline-block rounded-2xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
              >
                Sell electronics
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">{items.length} listings</p>
              <div className={BROWSE_GRID_CLASS}>
                {items.map((item, i) => (
                  <ElectronicsCard key={item.id} listing={item} priorityImage={i < 4} />
                ))}
              </div>
            </>
          )}
        </Suspense>
      </div>
    </main>
  );
}
