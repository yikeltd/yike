import { Suspense } from "react";
import dynamic from "next/dynamic";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeHotPicksSections } from "@/components/home/home-hotspot-row";
import { HomeFilteredFeed } from "@/components/home/home-sections";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { getHomeHeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents.server";
import { parseSearchParams } from "@/lib/properties";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import { PrefSync } from "@/components/personalization/pref-sync";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";

const BrowseRail = dynamic(
  () =>
    import("@/components/retention/browse-rail").then((m) => ({
      default: m.BrowseRail,
    })),
  { loading: () => null }
);

function SectionFallback() {
  return (
    <div className="px-3 py-6 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [stats, trustedAgents] = await Promise.all([
    getMarketplaceStats(),
    getHomeHeroTrustedAgentsConfig(),
  ]);
  const filters = parseSearchParams(params);
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
    <div className="home-canvas min-h-[100dvh] lg:pb-8">
      <PrefSync />
      <Suspense fallback={null}>
        <HomeSearchHero initial={initial} trustedAgents={trustedAgents} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <HomeHotPicksSections />
      </Suspense>

      <Suspense fallback={null}>
        <AdminPromoSlot
          placement="homepage_inline"
          variant="card"
          className="mx-auto max-w-7xl px-3 pt-3 lg:px-6 xl:px-8"
        />
      </Suspense>

      <Suspense fallback={null}>
        <div className="mt-3">
          <BrowseRail />
        </div>
      </Suspense>

      <section className="mx-auto max-w-7xl px-3 pt-5 lg:px-6 xl:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark dark:text-gold">
              For you
            </p>
            <h2 className="text-xl font-bold text-foreground lg:text-2xl">
              Homes for you
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Verified listings · WhatsApp contact · Trusted agents
            </p>
          </div>
          <SocialProofBar stats={stats} />
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HomeFilteredFeed filters={filters} />
      </Suspense>
    </div>
  );
}
