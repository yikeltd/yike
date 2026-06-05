import Image from "next/image";
import Link from "next/link";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { countListingsForCity } from "@/lib/listing-counts";
import { ArrowRight } from "lucide-react";

export async function PopularCities() {
  const counts = await Promise.all(
    TRENDING_CITIES.map((city) => countListingsForCity(city.searchCity))
  );

  return (
    <section className="mt-6 px-3 lg:mt-12 lg:px-0">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy lg:text-2xl">
            Popular cities
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Browse homes across Nigeria
          </p>
        </div>
        <Link
          href="/search"
          className="hidden text-sm font-bold text-gold-dark hover:underline lg:inline"
        >
          View all
        </Link>
      </div>
      <div className="hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
        {TRENDING_CITIES.map((city, i) => {
          const count = counts[i];
          return (
            <Link
              key={city.slug}
              href={city.seoPath}
              className="pressable card-lift group relative w-[min(72vw,220px)] shrink-0 overflow-hidden rounded-2xl bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06] lg:w-auto"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 220px, 200px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-base font-bold text-white lg:text-lg">
                    {city.name}
                  </p>
                  <p className="text-xs text-white/80">{city.tagline}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-xs font-semibold text-muted">
                  <span className="font-bold text-navy">{count}</span>{" "}
                  {count === 1 ? "home" : "homes"}
                </p>
                <span className="flex items-center gap-0.5 text-xs font-bold text-gold-dark">
                  Browse
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
