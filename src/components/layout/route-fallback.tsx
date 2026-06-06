import Link from "next/link";
import { Search, Home } from "lucide-react";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { getPublicProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/property/property-card";
import { fromSlug, resolveAreaSlug, resolveCitySlug } from "@/lib/location-slugs";

type RouteFallbackProps = {
  title?: string;
  message?: string;
  /** Parsed path hint for contextual listings */
  pathHint?: string;
  searchHref?: string;
};

export async function RouteFallback({
  title = "We couldn't find that exact page",
  message = "The link may be old or mistyped — but you can still browse homes below.",
  pathHint,
  searchHref = "/search",
}: RouteFallbackProps) {
  let listingsParams: Parameters<typeof getPublicProperties>[0] = {};
  let subtitle = message;

  if (pathHint) {
    const parts = pathHint.split("/").filter(Boolean);
    if (parts.length >= 1) {
      const city = resolveCitySlug(parts[0]!);
      if (city) {
        listingsParams = { city: city.city };
        subtitle = `Showing homes in ${city.city} — refine with search.`;
        searchHref = `/search?city=${encodeURIComponent(city.city)}`;
      }
      if (parts.length >= 2) {
        const area = resolveAreaSlug(parts[0]!, parts[1]!);
        if (area) {
          listingsParams = { city: area.city, area: area.area };
          subtitle = `Showing homes in ${area.area}, ${area.city}.`;
          searchHref = `/search?city=${encodeURIComponent(area.city)}&area=${encodeURIComponent(area.area)}`;
        } else if (city) {
          const guessedArea = fromSlug(parts[1]!);
          listingsParams = { city: city.city, area: guessedArea };
          searchHref = `/search?city=${encodeURIComponent(city.city)}&area=${encodeURIComponent(guessedArea)}`;
        }
      }
    }
  }

  const listings = await getPublicProperties(listingsParams, 6);
  const cards = listings.slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-0 lg:py-14">
      <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Search homes
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-navy"
          >
            <Home className="h-4 w-4" />
            Explore listings
          </Link>
        </div>
      </div>

      {cards.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-bold text-navy">Homes you can view now</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cards.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          <Link
            href={searchHref}
            className="mt-4 inline-block text-sm font-semibold text-gold-dark hover:underline"
          >
            See more results →
          </Link>
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
