import Link from "next/link";
import { Home, Search } from "lucide-react";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { Logo } from "@/components/brand/logo";

export function PageNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <Logo href="/" size={56} />
      <h1 className="mt-6 text-2xl font-bold text-navy">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        That link may be old or mistyped. Try search or browse listings on the home
        feed instead.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/search"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white"
        >
          <Search className="h-4 w-4" />
          Search homes
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-semibold text-navy"
        >
          <Home className="h-4 w-4" />
          Explore listings
        </Link>
      </div>

      <div className="mt-10 w-full text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Popular cities
        </p>
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
      </div>
    </div>
  );
}
