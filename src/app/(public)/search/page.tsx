import { Suspense } from "react";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  parseSearchParams,
} from "@/lib/properties";
import { SearchExperience } from "@/components/search/search-experience";
import { SearchPanel } from "@/components/search/search-panel";
import { SearchFiltersBar } from "@/components/search/search-filters-bar";
import { SearchHubBanner } from "@/components/search/search-hub-banner";
import { isDemoProperty } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
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

  const label = [
    params.hub === "student"
      ? "Student housing"
      : params.hub === "affordable"
        ? "Affordable"
        : params.hub,
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

  return (
    <div className="pb-4 lg:pb-12">
      <section className="hidden lg:block lg:py-10">
        <h1 className="text-3xl font-bold text-navy">Search homes</h1>
        <p className="mt-2 text-muted">
          Nationwide rentals, sales and shortlets across Nigeria
        </p>
        <SearchPanel variant="inline" className="mt-8" />
      </section>

      <div className="lg:hidden">
        <SearchExperience
          initialType={params.listing_type}
          initialCity={params.city}
        />
      </div>

      <Suspense fallback={null}>
        <SearchFiltersBar className="mt-4 lg:mt-6" />
      </Suspense>

      {hub && <SearchHubBanner hub={hub} />}

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
          emptyMessage="No homes match your filters. Try a nearby area or wider budget."
        />
      </section>
    </div>
  );
}
