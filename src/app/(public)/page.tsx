import { Suspense } from "react";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeHotPicksSections } from "@/components/home/home-hotspot-row";
import { HomeFilteredFeed } from "@/components/home/home-sections";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { parseSearchParams } from "@/lib/properties";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

function SectionFallback() {
  return (
    <div className="px-3 py-4 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const stats = await getMarketplaceStats();
  const filters = parseSearchParams(await searchParams);
  const initial = {
    listingType: filters.listing_type,
    hub: filters.hub,
    propertyType: filters.property_type,
    state: filters.state,
    city: filters.city,
    area: filters.area,
    min: filters.min_price ? String(filters.min_price) : undefined,
    max: filters.max_price ? String(filters.max_price) : undefined,
  };

  return (
    <div className="home-canvas pb-2 lg:pb-0">
      <section className="full-bleed relative overflow-hidden border-b border-gold/15 bg-gradient-to-br from-navy via-navy-mid to-navy-dark">
        <div className="mesh-hero absolute inset-0 opacity-45" aria-hidden />
        <div className="relative mx-auto max-w-7xl lg:px-6 xl:px-8">
          <Suspense fallback={null}>
            <HomeSearchHero initial={initial} />
          </Suspense>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 pt-5 lg:px-6 xl:px-8">
        <div className="mb-4 border-l-[3px] border-gold pl-3">
          <h2 className="text-lg font-bold text-foreground lg:text-xl">
            Homes for you
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Verified listings · WhatsApp contact
          </p>
        </div>
        <SocialProofBar stats={stats} />
      </div>

      <Suspense fallback={<SectionFallback />}>
        <HomeFilteredFeed filters={filters} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <HomeHotPicksSections />
      </Suspense>
    </div>
  );
}
