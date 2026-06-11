import Link from "next/link";
import { PropertyGrid } from "@/components/property/property-grid";
import { EmptyStateRich } from "@/components/property/empty-state-rich";
import {
  getFeaturedProperties,
  getPublicProperties,
  getVerifiedListings,
  type PropertySearchParams,
} from "@/lib/properties";
import { getMostViewedListings } from "@/lib/trending";
import { getActiveAd } from "@/lib/ads";
import { withDemoFallback } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { POPULAR_AREAS } from "@/lib/constants";
import { getServerSearchPreferences } from "@/lib/search-preferences";
import { isFeaturedListingsEnabled } from "@/lib/feature-flags";
import { isFeaturedActive } from "@/lib/agent-tiers";

function logHomeSectionFailure(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[home] ${label} unavailable`, message);
}

async function safeHomeLoad<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    logHomeSectionFailure(label, error);
    return fallback;
  }
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "See all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between px-3 lg:px-0">
      <div className="border-l-[3px] border-gold pl-3">
        <h2 className="text-lg font-bold text-foreground lg:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export async function HomeShowcaseSection() {
  const [featured, trending, recent] = await Promise.all([
    safeHomeLoad("showcase featured", () => getFeaturedProperties(6), []),
    safeHomeLoad("showcase trending", () => getMostViewedListings(6), []),
    safeHomeLoad("showcase recent", () => getPublicProperties({}, 6), []),
  ]);

  const merged = [...featured, ...trending, ...recent].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );
  const { items, isDemo } = withDemoFallback(merged);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-6 max-w-7xl px-3 lg:mt-8 lg:px-6 xl:px-8">
      <SectionHeader
        title="Trending homes"
        subtitle="Fresh verified listings across Nigeria"
        href="/search"
      />
      <PropertyGrid properties={items} isDemo={isDemo} richEmpty={false} />
    </section>
  );
}

export async function HomeFeaturedSection() {
  if (!isFeaturedListingsEnabled()) return null;

  const featured = await safeHomeLoad("featured listings", () => getFeaturedProperties(6), []);
  const active = featured.filter((p) => isFeaturedActive(p));
  if (active.length === 0) return null;

  return (
    <section className="mx-auto mt-6 max-w-7xl px-3 lg:mt-8 lg:px-6 xl:px-8">
      <SectionHeader
        title="Featured homes"
        subtitle="Promoted listings with extra visibility"
        href="/search?featured=1"
      />
      <PropertyGrid properties={active.slice(0, 6)} trackFeaturedAnalytics />
    </section>
  );
}

export async function HomeVerifiedSection() {
  const verified = await safeHomeLoad("verified listings", () => getVerifiedListings(6), []);
  const { items, isDemo } = withDemoFallback(verified);
  if (items.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <SectionHeader
        title="Verified listings"
        subtitle="Identity-checked agents"
        href="/search?verified=1"
      />
      <PropertyGrid properties={items.slice(0, 6)} isDemo={isDemo} />
    </section>
  );
}

export async function HomeTrendingSection() {
  const trending = await safeHomeLoad("trending listings", () => getMostViewedListings(6), []);
  const { items, isDemo } = withDemoFallback(trending);
  if (items.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <SectionHeader
        title="Trending now"
        subtitle="Homes getting the most views"
        href="/search"
      />
      <PropertyGrid properties={items.slice(0, 6)} isDemo={isDemo} />
    </section>
  );
}

export async function HomeRecentSection() {
  const recent = await safeHomeLoad("recent listings", () => getPublicProperties({}, 8), []);
  const { items, isDemo } = withDemoFallback(recent);
  if (items.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <SectionHeader
        title="Recently added"
        subtitle="Fresh on Yike"
        href="/search"
      />
      <PropertyGrid properties={items.slice(0, 8)} isDemo={isDemo} />
    </section>
  );
}

export async function HomeFilteredFeed({
  filters,
}: {
  filters: PropertySearchParams;
}) {
  const active = hasActiveFilters(filters);
  const inferred = active
    ? {}
    : await safeHomeLoad("search preferences", getServerSearchPreferences, {});
  const query = active ? filters : { ...inferred };
  const properties = await safeHomeLoad("feed listings", () => getPublicProperties(query, 24), []);
  const { items, isDemo } = withDemoFallback(properties, { allowEmpty: active });
  const midAd = await safeHomeLoad("home feed ad", () => getActiveAd("home_feed_mid"), null);

  if (items.length === 0) {
    return (
      <section className="mt-4 space-y-6 px-3 lg:px-0">
        <EmptyStateRich
          message="No homes match these filters. Try a nearby area or wider budget."
          city={filters.city}
          area={filters.area}
        />
      </section>
    );
  }

  return (
    <section className="section-editorial mx-auto mt-4 max-w-7xl px-3 lg:mt-6 lg:px-6 xl:px-8">
      <PropertyGrid
        properties={items.slice(0, active ? 24 : 12)}
        emptyCity={query.city}
        emptyArea={query.area}
        isDemo={isDemo}
        midFeedAd={midAd}
        feedAdInsertAfter={4}
        adPlacementKey="home_feed_mid"
      />
    </section>
  );
}

export function PopularAreasSection() {
  return (
    <section className="mx-auto mt-8 max-w-7xl px-3 lg:mt-12 lg:px-6 xl:px-8">
      <SectionHeader
        title="Popular areas"
        subtitle="High-demand neighborhoods"
      />
      <div className="hide-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {POPULAR_AREAS.map((t) => (
          <Link
            key={t.href}
            href={t.seoPath}
            className="pressable shrink-0 rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold text-foreground shadow-float ring-1 ring-black/[0.04] transition-colors hover:bg-gold/10 dark:ring-white/[0.06] lg:rounded-xl lg:px-5 lg:py-3"
          >
            {t.label}
          </Link>
        ))}
      </div>
      <p className="mt-4 px-3 lg:px-0">
        <Link
          href="/explore"
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          Browse popular property searches
        </Link>
      </p>
    </section>
  );
}
