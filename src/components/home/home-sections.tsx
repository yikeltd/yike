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

export async function HomeFeaturedSection() {
  const featured = await getFeaturedProperties(6);
  const { items, isDemo } = withDemoFallback(featured);
  if (items.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <SectionHeader
        title="Featured homes"
        subtitle="Hand-picked across Nigeria"
        href="/search?featured=1"
      />
      <PropertyGrid properties={items.slice(0, 6)} isDemo={isDemo} />
    </section>
  );
}

export async function HomeVerifiedSection() {
  const verified = await getVerifiedListings(6);
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
  const trending = await getMostViewedListings(6);
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
  const recent = await getPublicProperties({}, 8);
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
  const properties = await getPublicProperties(active ? filters : {}, 24);
  const { items, isDemo } = withDemoFallback(properties);
  const midAd = await getActiveAd("home_feed_mid");

  if (items.length === 0) {
    return (
      <section className="mt-4 px-3 lg:px-0">
        <EmptyStateRich
          message="No homes match these filters. Try a nearby area or wider budget."
          city={filters.city}
          area={filters.area}
        />
      </section>
    );
  }

  return (
    <section className="mt-4 lg:mt-6">
      {!active && (
        <SectionHeader
          title="Homes for you"
          subtitle="Verified listings · WhatsApp contact"
        />
      )}
      <PropertyGrid
        properties={items.slice(0, active ? 24 : 10)}
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
    <section className="mt-8 px-3 lg:mt-12 lg:px-0">
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
    </section>
  );
}
