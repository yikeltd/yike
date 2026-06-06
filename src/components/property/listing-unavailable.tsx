import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import type { Property } from "@/types/database";
import { getPublicProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/property/property-card";

type ListingUnavailableProps = {
  property: Property | null;
  reason: "missing" | "expired" | "unpublished";
};

function reasonCopy(reason: ListingUnavailableProps["reason"]) {
  switch (reason) {
    case "expired":
      return "This listing has expired or been rented out.";
    case "unpublished":
      return "This listing is no longer available.";
    default:
      return "This property may no longer be available.";
  }
}

export async function ListingUnavailable({
  property,
  reason,
}: ListingUnavailableProps) {
  const searchParams: Parameters<typeof getPublicProperties>[0] = {};

  if (property != null) {
    searchParams.city = property.city;
    searchParams.area = property.area;
    if (property.property_type) {
      searchParams.property_type = property.property_type;
    }
    if (property.listing_type) {
      searchParams.listing_type = property.listing_type;
    }
    const price = Number(property.price);
    if (Number.isFinite(price) && price > 0) {
      searchParams.min_price = Math.floor(price * 0.75);
      searchParams.max_price = Math.ceil(price * 1.25);
    }
  }

  const alternatives = await getPublicProperties(searchParams, 12);
  const filtered = alternatives.filter((p) => p.id !== property?.id).slice(0, 4);
  const searchHref =
    property != null
      ? `/search?city=${encodeURIComponent(property.city)}${
          property.area
            ? `&area=${encodeURIComponent(property.area)}`
            : ""
        }${
          property.property_type
            ? `&property_type=${encodeURIComponent(property.property_type)}`
            : ""
        }`
      : "/search";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-0 lg:py-14">
      <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface">
          <MapPin className="h-7 w-7 text-gold" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-navy">This home is unavailable</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{reasonCopy(reason)}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={searchHref}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Search homes
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-navy"
          >
            Explore listings
          </Link>
        </div>
      </div>

      {filtered.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-bold text-navy">Similar homes you can view now</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Popular cities
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING_CITIES.slice(0, 8).map((city) => (
            <Link
              key={city.slug}
              href={city.seoPath}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/40"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
