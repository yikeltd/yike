import Link from "next/link";
import { PropertyFeed } from "@/components/property/property-feed";
import { getPublicProperties } from "@/lib/properties";
import { SearchPanel } from "@/components/search/search-panel";
import { AreaGuidePanel } from "@/components/search/area-guide-panel";
import { AdSlot } from "@/components/ads/ad-slot";
import { countListingsForArea, countListingsForCity } from "@/lib/listing-counts";
import { isDemoProperty } from "@/lib/mock-listings";

export async function LocationListingsPage({
  title,
  description,
  searchParams,
  city,
  area,
  state,
  breadcrumb,
}: {
  title: string;
  description: string;
  searchParams: { type?: string };
  city: string;
  area?: string;
  state: string;
  breadcrumb?: { label: string; href: string }[];
}) {
  const params = {
    city,
    area,
    state,
    listing_type: searchParams.type,
  };
  const properties = await getPublicProperties(params, 48);
  const isDemo =
    properties.length > 0 && properties.every((p) => isDemoProperty(p.id));
  const count = area
    ? await countListingsForArea(city, area)
    : await countListingsForCity(city);

  return (
    <div className="pb-8 lg:pb-12">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-4 flex flex-wrap gap-1 text-sm text-muted">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          {breadcrumb.map((b) => (
            <span key={b.href} className="flex items-center gap-1">
              <span>/</span>
              <Link href={b.href} className="hover:text-navy">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <header className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-navy lg:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted lg:text-base">
          {description}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-bold text-navy">{count}</span> homes available
          {isDemo && (
            <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-dark">
              Sample data
            </span>
          )}
        </p>
      </header>

      <div className="mb-8 hidden lg:block">
        <SearchPanel variant="inline" />
      </div>

      {area && (
        <AreaGuidePanel city={city} area={area} state={state} />
      )}

      <AdSlot placement="location_top" className="mb-6" />

      <PropertyFeed properties={properties} isDemo={isDemo} showCount />
    </div>
  );
}
