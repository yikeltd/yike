import Link from "next/link";
import { Home, MapPin, Search, PenLine, Building2 } from "lucide-react";
import { ListPropertyCta } from "@/components/auth/list-property-cta";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { TRENDING_SEARCH_LINKS } from "@/constants/popularAreas";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";

export function EmptyStateRich({
  title = "No homes yet",
  message,
  city,
  area,
  listingType,
  propertyType,
}: {
  title?: string;
  message?: string;
  city?: string;
  area?: string;
  listingType?: string;
  propertyType?: string;
}) {
  const nearby = POPULAR_AREAS.filter((a) => {
    if (area && a.area.toLowerCase() === area.toLowerCase()) return false;
    if (city) return a.city.toLowerCase() === city.toLowerCase();
    return true;
  }).slice(0, 6);

  const related = TRENDING_SEARCH_LINKS.slice(0, 4);

  const typeSuggestions = SEARCH_DEAL_TYPES.filter(
    (chip) => chip.value && chip.value !== listingType
  ).slice(0, 4);

  const propertySuggestions = [
    { label: "Apartments", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}propertyType=apartment` },
    { label: "Self contain", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}propertyType=self-contain` },
    { label: "Duplex", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}propertyType=duplex` },
    { label: "Land", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}listingType=sale&propertyType=land` },
  ].filter((s) => !propertyType || !s.href.includes(propertyType));

  return (
    <div className="mx-3 rounded-2xl bg-elevated px-6 py-10 text-center shadow-float lg:mx-0">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Home className="h-8 w-8 text-gold" />
      </div>
      <p className="mt-4 text-base font-bold text-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {message ??
          (area
            ? `No listings yet in ${area} — explore nearby neighborhoods or tell us what you need.`
            : city
              ? `Nothing live in ${city} right now — check nearby areas or request a property.`
              : "Beautiful homes are coming soon. Try a nearby area or wider filters.")}
      </p>

      {nearby.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Nearby areas
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nearby.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="pressable inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gold/10"
              >
                <MapPin className="h-3 w-3 text-gold" />
                {a.area}
              </Link>
            ))}
          </div>
        </div>
      )}

      {typeSuggestions.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Similar property types
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeSuggestions.map((chip) => (
              <Link
                key={chip.value}
                href={`/search?${[
                  city ? `city=${encodeURIComponent(city)}` : "",
                  area ? `area=${encodeURIComponent(area)}` : "",
                  `listingType=${chip.value}`,
                ]
                  .filter(Boolean)
                  .join("&")}`}
                className="pressable inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gold/10"
              >
                <Building2 className="h-3 w-3 text-gold" />
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {propertySuggestions.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Try another type
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {propertySuggestions.slice(0, 4).map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="pressable rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gold/10"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Trending searches
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="pressable rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gold/10"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/request-property"
          className="pressable inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy shadow-glow-gold"
        >
          <PenLine className="h-4 w-4" />
          Request a property
        </Link>
        <Link
          href="/search"
          className="pressable inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          <Search className="h-4 w-4" />
          Browse all listings
        </Link>
        <ListPropertyCta className="pressable inline-flex items-center justify-center rounded-xl border border-surface px-5 py-3 text-sm font-bold text-navy">
          List property free
        </ListPropertyCta>
      </div>
    </div>
  );
}
