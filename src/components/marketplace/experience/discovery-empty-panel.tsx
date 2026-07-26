"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PopularSearchChips,
  VEHICLE_POPULAR_SEARCHES,
  PROPERTY_POPULAR_SEARCHES,
} from "./popular-search-chips";
import {
  CategoryBrowseGrid,
  VEHICLE_CATEGORY_BROWSE,
  PROPERTY_CATEGORY_BROWSE,
} from "./category-browse-grid";
import {
  CityBrowseGrid,
  VEHICLE_CITY_BROWSE,
  PROPERTY_CITY_BROWSE,
} from "./city-browse-grid";
import {
  trendingSearchesForCategory,
} from "@/lib/home/marketplace-trending";
import { getRecentSearches, type RecentSearch } from "@/lib/search-recent";
import { cn } from "@/lib/utils";

/**
 * Rich empty / pre-query exploration — never leave a blank page.
 * Links only to existing filtered routes.
 */
export function DiscoveryEmptyPanel({
  category = "vehicle",
  className,
  title = "Keep exploring",
  subtitle = "Popular categories, searches, and cities — tap to browse.",
  showLatestHref,
}: {
  category?: "vehicle" | "property";
  className?: string;
  title?: string;
  subtitle?: string;
  showLatestHref?: string;
}) {
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const isVehicle = category === "vehicle";
  const trending = trendingSearchesForCategory(
    isVehicle ? "vehicle" : "property",
  );

  useEffect(() => {
    setRecent(getRecentSearches().slice(0, 6));
  }, []);

  return (
    <div
      className={cn(
        "space-y-6 rounded-[1.5rem] border border-navy/8 bg-gradient-to-b from-white to-[#f4f6fa] p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-bold tracking-tight text-navy">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-navy/45">{subtitle}</p>
      </div>

      {recent.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
            Recent searches
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="pressable inline-flex shrink-0 rounded-full border border-dashed border-navy/15 bg-white px-3.5 py-2 text-xs font-semibold text-navy"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <PopularSearchChips
        label="Trending searches"
        items={
          isVehicle ? VEHICLE_POPULAR_SEARCHES : PROPERTY_POPULAR_SEARCHES
        }
      />

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
          Popular categories
        </p>
        <CategoryBrowseGrid
          items={isVehicle ? VEHICLE_CATEGORY_BROWSE : PROPERTY_CATEGORY_BROWSE}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
          Nearby & trending
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trending.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="pressable inline-flex shrink-0 rounded-full border border-navy/10 bg-white px-3.5 py-2 text-xs font-bold text-navy shadow-sm"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <CityBrowseGrid
        items={isVehicle ? VEHICLE_CITY_BROWSE : PROPERTY_CITY_BROWSE}
        title="Browse nearby cities"
        subtitle="Try another city or filter"
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href={isVehicle ? "/vehicles" : "/search"}
          className="pressable inline-flex rounded-xl border border-navy/12 bg-white px-4 py-2.5 text-sm font-bold text-navy"
        >
          Try another filter
        </Link>
        {showLatestHref ? (
          <Link
            href={showLatestHref}
            className="pressable inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy"
          >
            Latest listings
          </Link>
        ) : null}
      </div>
    </div>
  );
}
