import { Suspense } from "react";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  parseSearchParams,
} from "@/lib/properties";
import { SearchDiscoveryHub } from "@/components/search/search-discovery-hub";
import { SearchPanel } from "@/components/search/search-panel";
import { SearchFiltersBar } from "@/components/search/search-filters-bar";
import { SearchHubBanner } from "@/components/search/search-hub-banner";
import { isDemoProperty } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { hubLabel } from "@/constants/listingTypes";
import { getActiveAd } from "@/lib/ads";
import { AdSlot } from "@/components/ads/ad-slot";
import { cn } from "@/lib/utils";
import type { DiscoverHub } from "@/types/database";

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

  const hub =
    params.hub && params.hub !== "shortlet"
      ? (params.hub as DiscoverHub)
      : params.listing_type === "shortlet"
        ? ("shortlet" as DiscoverHub)
        : undefined;

  const rawParams = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const currentHref = qs.toString() ? `/search?${qs.toString()}` : undefined;

  return (
    <div className="pb-4 lg:pb-12">
      <section className="hidden lg:block lg:py-10">
        <h1 className="text-3xl font-bold text-foreground">Search hub</h1>
        <p className="mt-2 text-muted">
          Advanced filters, saved searches, and nationwide discovery
        </p>
        <SearchPanel variant="inline" className="mt-8" />
      </section>

      <div className="lg:hidden">
        <SearchDiscoveryHub
          hasResults={hasQuery}
          currentHref={currentHref}
          currentLabel={label || undefined}
        />
      </div>

      <Suspense fallback={null}>
        <SearchFiltersBar
          className={cn(
            "mt-4 lg:mt-6",
            (params.city || params.area) && "hidden lg:flex"
          )}
        />
      </Suspense>

      {hub && <SearchHubBanner hub={hub} />}

      <AdSlot placement="search_top" className="mt-4 lg:mt-6" />

      <section className="mt-6 lg:mt-8">
        <p className="mb-4 px-3 text-sm text-muted lg:px-0">
          <span className="font-bold text-navy">{properties.length}</span>{" "}
          {properties.length === 1 ? "home" : "homes"}
          {hasQuery && label && (
            <span className="capitalize"> · {label}</span>
          )}
          {!hasQuery && (
            <span> · Browse listings nationwide</span>
          )}
        </p>
        <PropertyFeed
          properties={properties}
          isDemo={isDemo}
          midFeedAd={feedAd}
          feedAdInsertAfter={5}
          adPlacementKey="search_feed_mid"
          emptyMessage="No homes match your filters. Try a nearby area or wider budget."
        />
      </section>
    </div>
  );
}
