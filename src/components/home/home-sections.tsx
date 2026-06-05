import Link from "next/link";
import { PropertyGrid } from "@/components/property/property-grid";
import { getFeaturedProperties, getPublicProperties, getVerifiedListings } from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
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
      <div>
        <h2 className="text-lg font-bold text-navy lg:text-2xl">{title}</h2>
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

export async function HomeRecentSection() {
  const recent = await getPublicProperties({}, 8);
  const { items, isDemo } = withDemoFallback(recent);
  if (items.length === 0) return null;
  return (
    <section className="mt-8 hidden lg:mt-12 lg:block">
      <SectionHeader
        title="Recently added"
        subtitle="Fresh on Yike"
        href="/search"
      />
      <PropertyGrid properties={items.slice(0, 8)} isDemo={isDemo} />
    </section>
  );
}

export async function HomeMobileFeed() {
  const [featured, latest] = await Promise.all([
    getFeaturedProperties(4),
    getPublicProperties({}, 8),
  ]);
  const merged = [...featured, ...latest];
  const seen = new Set<string>();
  const items = merged.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  const { items: feed, isDemo } = withDemoFallback(items);
  return (
    <section className="mt-4 lg:hidden">
      <PropertyGrid properties={feed.slice(0, 10)} isDemo={isDemo} showCount />
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
            className="pressable shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-float transition-colors hover:bg-gold/10 lg:rounded-xl lg:px-5 lg:py-3"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
