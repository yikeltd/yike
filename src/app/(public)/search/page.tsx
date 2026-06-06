import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  parseSearchParams,
} from "@/lib/properties";
import { SearchDiscoveryHub } from "@/components/search/search-discovery-hub";
import { SearchResultsChrome } from "@/components/search/search-results-chrome";
import { isDemoProperty } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { hubLabel } from "@/constants/listingTypes";
import { getActiveAd } from "@/lib/ads";
import { AdSlot } from "@/components/ads/ad-slot";
export const metadata: Metadata = {
  title: `Search Homes in Nigeria`,
  description: `Search apartments, houses, hotels and land across Nigeria. Filter by city, area, budget and property type on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: `Search Nigerian Property | ${SITE_NAME}`,
    description: "Find verified rentals and homes — mobile-first, WhatsApp contact.",
    url: `${SITE_URL}/search`,
  },
};

function ResultsFallback() {
  return <div className="h-24 border-b border-surface bg-elevated/95" />;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseSearchParams(await searchParams);
  const hasQuery = hasActiveFilters(params);
  const properties = await getPublicProperties(
    hasQuery ? params : {},
    48
  );
  const isDemo =
    properties.length > 0 && properties.every((p) => isDemoProperty(p.id));

  const feedAd = await getActiveAd("search_feed_mid");

  const label = [
    params.hub ? hubLabel(params.hub) : null,
    params.listing_type,
    params.city,
    params.area,
  ]
    .filter(Boolean)
    .join(" · ");

  const rawParams = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const currentHref = qs.toString() ? `/search?${qs.toString()}` : undefined;

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-background pb-4 lg:pb-12">
      {!hasQuery ? (
        <>
          <SearchDiscoveryHub />
          <p className="mx-auto mt-4 max-w-md px-6 text-center text-xs text-muted">
            Results appear here after you pick a location or filter.
          </p>
        </>
      ) : (
        <Suspense fallback={<ResultsFallback />}>
          <SearchResultsChrome
            resultCount={properties.length}
            currentHref={currentHref}
            currentLabel={label || undefined}
          >
            <AdSlot
              placement="search_top"
              className="mt-3 hidden px-3 lg:block lg:px-0"
            />

            <section className="mt-3 lg:mt-4">
              <PropertyFeed
                properties={properties}
                isDemo={isDemo}
                midFeedAd={feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
                emptyMessage="No homes match your filters. Try a nearby area or wider budget."
                emptyCity={params.city}
                emptyArea={params.area}
              />
            </section>
          </SearchResultsChrome>
        </Suspense>
      )}
    </div>
  );
}
