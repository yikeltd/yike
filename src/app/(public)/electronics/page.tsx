import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicElectronics } from "@/lib/marketplace/listings";
import { ElectronicsCard } from "@/components/marketplace/electronics-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import {
  isSampleListingFixtureEnabled,
  isSampleListingFixtureForceEnabled,
} from "@/lib/sample-listings/flags";
import { sampleBrowseFallback } from "@/lib/sample-listings/query-fixtures";
import { isElectronicsBrowseSubmitted } from "@/lib/marketplace/browse-submitted";
import { ElectronicsDiscoverySearch } from "@/components/marketplace/electronics-discovery-search";
import { ElectronicsSearchResultsChrome } from "@/components/marketplace/electronics-search-results-chrome";

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

function ResultsFallback() {
  return (
    <div className="space-y-3 px-3 pt-2">
      <div className="skeleton h-14 w-full rounded-xl" />
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}

export default async function ElectronicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isLaunchFeatureVisible("electronics_marketplace")) notFound();

  const sp = await searchParams;
  const submittedSearch = isElectronicsBrowseSubmitted(sp);
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

  const fixtureOn = isSampleListingFixtureEnabled();
  const fixtureForce = isSampleListingFixtureForceEnabled();
  if (fixtureOn) {
    const liveCount = items.length;
    items = sampleBrowseFallback(items, "ELECTRONICS", {
      q: first(sp.q),
      state: first(sp.state),
      city: first(sp.city),
      auto_category: first(sp.category),
      brand: first(sp.brand),
      condition: first(sp.condition),
      min_price: first(sp.min_price) ? Number(first(sp.min_price)) : undefined,
      max_price: first(sp.max_price) ? Number(first(sp.max_price)) : undefined,
    });
    if (submittedSearch && liveCount === 0 && !fixtureForce && items.length > 0) {
      items = [];
    }
  }

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] lg:pb-8">
      <div
        className={
          submittedSearch
            ? "px-3 pt-2 lg:px-6 xl:px-8"
            : "space-y-3 px-3 pt-4 lg:px-6 xl:px-8"
        }
      >
        <MarketplaceCategoryHeader
          vertical="electronics"
          title="Electronics"
          className={submittedSearch ? "mb-1" : "mb-2"}
        />
        {!submittedSearch ? (
          <ElectronicsDiscoverySearch
            defaultQuery={first(sp.q) ?? ""}
            defaultCategory={first(sp.category) ?? ""}
          />
        ) : null}
      </div>

      <Suspense fallback={<ResultsFallback />}>
        {submittedSearch ? (
          <ElectronicsSearchResultsChrome
            resultCount={items.length}
            filtersDefaultOpen={false}
          >
            <section className="mt-0 w-full px-3 lg:px-6 xl:px-8">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center">
                  <h2 className="text-lg font-bold text-navy">No electronics match</h2>
                  <p className="mt-2 text-sm text-muted">
                    Try another filter or check back soon.
                  </p>
                  <Link
                    href="/electronics"
                    className="pressable mt-4 inline-block text-sm font-semibold text-gold"
                  >
                    Clear filters
                  </Link>
                </div>
              ) : (
                <div className={BROWSE_GRID_CLASS}>
                  {items.map((item, i) => (
                    <ElectronicsCard
                      key={item.id}
                      listing={item}
                      priorityImage={i < 4}
                    />
                  ))}
                </div>
              )}
            </section>
          </ElectronicsSearchResultsChrome>
        ) : (
          <section className="mt-0 w-full px-3 lg:px-6 xl:px-8">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center">
                <h2 className="text-lg font-bold text-navy">Start exploring electronics</h2>
                <p className="mt-2 text-sm text-muted">
                  Search phones, laptops, appliances, and more across Nigeria.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm font-bold text-navy">
                  {items.length} {items.length === 1 ? "listing" : "listings"}
                </p>
                <div className={BROWSE_GRID_CLASS}>
                  {items.map((item, i) => (
                    <ElectronicsCard
                      key={item.id}
                      listing={item}
                      priorityImage={i < 4}
                    />
                  ))}
                </div>
              </>
            )}
            <Link
              href="/agent/listings/new/electronics"
              className="pressable mt-6 inline-block rounded-2xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
            >
              Sell electronics
            </Link>
          </section>
        )}
      </Suspense>
    </div>
  );
}
