import Link from "next/link";
import { Home, MapPin, Search, PenLine, Building2 } from "lucide-react";
import { ListPropertyCta } from "@/components/auth/list-property-cta";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { propertyTypeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function EmptyStateRich({
  title = "No homes yet",
  message,
  city,
  area,
  listingType,
  propertyType,
  stateBrowseHref,
  clearFiltersHref,
  layout = "card",
}: {
  title?: string;
  message?: string;
  city?: string;
  area?: string;
  listingType?: string;
  propertyType?: string;
  stateBrowseHref?: string;
  clearFiltersHref?: string;
  layout?: "card" | "full";
}) {
  const nearby = POPULAR_AREAS.filter((a) => {
    if (area && a.area.toLowerCase() === area.toLowerCase()) return false;
    if (city) return a.city.toLowerCase() === city.toLowerCase();
    return false;
  }).slice(0, 6);

  const typeLabel = propertyType
    ? propertyTypeLabel(propertyType).toLowerCase()
    : listingType === "rent"
      ? "rentals"
      : listingType === "sale"
        ? "properties for sale"
        : "listings";

  const typeSuggestions = SEARCH_DEAL_TYPES.filter(
    (chip) => chip.value && chip.value !== listingType
  ).slice(0, 4);

  const propertySuggestions = propertyType
    ? []
    : [
        { label: "Apartments", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}property_type=apartment` },
        { label: "Self contain", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}property_type=self-contain` },
        { label: "Shops", href: `/search?${city ? `city=${encodeURIComponent(city)}&` : ""}property_type=shop` },
      ];

  return (
    <div
      className={cn(
        "text-center",
        layout === "card"
          ? "mx-3 rounded-2xl bg-elevated px-6 py-10 shadow-float lg:mx-0"
          : "w-full px-2 py-8 lg:px-0"
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Home className="h-8 w-8 text-gold" />
      </div>
      <p className="mt-4 text-base font-bold text-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {message ??
          (area
            ? `No ${typeLabel} yet in ${area} — try nearby neighborhoods or adjust filters.`
            : city
              ? `Nothing live in ${city} right now — check nearby areas or request a property.`
              : "Beautiful homes are coming soon. Try a nearby area or wider filters.")}
      </p>

      {(stateBrowseHref || clearFiltersHref) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {stateBrowseHref ? (
            <Link
              href={stateBrowseHref}
              className="pressable inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy shadow-glow-gold"
            >
              <Search className="h-4 w-4" />
              Browse {typeLabel} in area
            </Link>
          ) : null}
          {clearFiltersHref ? (
            <Link
              href={clearFiltersHref}
              className="pressable inline-flex items-center justify-center rounded-xl border border-navy/10 px-5 py-3 text-sm font-bold text-navy"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      )}

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

      {!stateBrowseHref && typeSuggestions.length > 0 && city && (
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
                  `type=${chip.value}`,
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

      {!stateBrowseHref && propertySuggestions.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Try another type
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {propertySuggestions.map((s) => (
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

      {!stateBrowseHref && (
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
      )}
    </div>
  );
}
