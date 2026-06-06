import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { getPublicProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/property/property-card";
import { TRENDING_CITIES } from "@/constants/trendingCities";

export async function AgentUnavailable() {
  const listings = await getPublicProperties({}, 6);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-0 lg:py-14">
      <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy">Agent profile unavailable</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          This agent profile may have been removed or the link is incorrect. Browse
          verified listings instead.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Search homes
          </Link>
          <Link
            href="/agent/become"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-navy"
          >
            <UserPlus className="h-4 w-4" />
            Become an agent
          </Link>
        </div>
      </div>

      {listings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-bold text-navy">Featured listings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {listings.slice(0, 4).map((p) => (
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
          {TRENDING_CITIES.slice(0, 6).map((city) => (
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
