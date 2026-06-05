import Link from "next/link";
import { Home, MapPin, Search, PenLine } from "lucide-react";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { TRENDING_SEARCH_LINKS } from "@/constants/popularAreas";

export function EmptyStateRich({
  title = "No homes yet",
  message,
  city,
  area,
}: {
  title?: string;
  message?: string;
  city?: string;
  area?: string;
}) {
  const nearby = POPULAR_AREAS.filter((a) => {
    if (area && a.area.toLowerCase() === area.toLowerCase()) return false;
    if (city) return a.city.toLowerCase() === city.toLowerCase();
    return true;
  }).slice(0, 6);

  const related = TRENDING_SEARCH_LINKS.slice(0, 4);

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

      <div className="mt-6 text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Try these searches
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
        <Link
          href="/post-property"
          className="pressable inline-flex items-center justify-center rounded-xl border border-surface px-5 py-3 text-sm font-bold text-navy"
        >
          List property free
        </Link>
      </div>
    </div>
  );
}
