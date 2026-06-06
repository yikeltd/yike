"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { getRecentSearches, TRENDING_AREAS } from "@/lib/search-recent";
import { getSavedSearches } from "@/lib/saved-searches";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { BrowseListingsBlock } from "./browse-listings-block";
import { SmartCityHint } from "@/components/personalization/smart-city-hint";
import { SearchCollapsible } from "./search-collapsible";
import { SearchFiltersBar } from "./search-filters-bar";
import {
  Bookmark,
  Clock,
  Layers,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";

const POPULAR_TYPES = PROPERTY_CATEGORIES.filter((c) =>
  ["self_contain", "mini_flat", "flat_2", "flat", "shop", "land"].includes(c.value)
);

const TRENDING_PREVIEW = TRENDING_AREAS.slice(0, 6);
const NEARBY_PREVIEW = POPULAR_AREAS.slice(0, 8);

export function SearchDiscoveryHub() {
  const router = useRouter();
  const [recent, setRecent] = useState(getRecentSearches());
  const [saved, setSaved] = useState(getSavedSearches());

  useEffect(() => {
    setRecent(getRecentSearches());
    setSaved(getSavedSearches());
  }, []);

  function pushSearch(params: URLSearchParams, label: string) {
    const href = `/search?${params.toString()}`;
    addRecentSearch({ label, href });
    saveBrowsePreferences({
      city: params.get("city") || undefined,
      area: params.get("area") || undefined,
      listingType: params.get("type") || undefined,
      propertyType: params.get("property_type") || undefined,
      minPrice: params.get("min") ? Number(params.get("min")) : undefined,
      maxPrice: params.get("max") ? Number(params.get("max")) : undefined,
    });
    router.push(href);
  }

  const hasHistory = saved.length > 0 || recent.length > 0;

  return (
    <div className="search-discovery mx-auto max-w-2xl space-y-3 px-3 pb-4 pt-3 lg:max-w-3xl lg:px-0 lg:pt-5">
      <header className="space-y-2 rounded-2xl border border-navy/10 bg-gradient-to-b from-navy/[0.06] to-transparent p-4">
        <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-foreground lg:text-2xl">
          Search smarter
        </h1>
        <p className="text-sm leading-relaxed text-navy/65 dark:text-muted">
          Find homes faster with intelligent location and property filters.
        </p>
        <SmartCityHint />
      </header>

      <BrowseListingsBlock onSearch={({ params, label }) => pushSearch(params, label)} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => pushSearch(new URLSearchParams({ verified: "1" }), "Verified")}
          className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface bg-white py-2.5 text-xs font-bold text-foreground shadow-sm dark:bg-elevated"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Verified
        </button>
        <button
          type="button"
          onClick={() => pushSearch(new URLSearchParams({ featured: "1" }), "Featured")}
          className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface bg-white py-2.5 text-xs font-bold text-foreground shadow-sm dark:bg-elevated"
        >
          <Star className="h-3.5 w-3.5 text-gold" />
          Featured
        </button>
        <button
          type="button"
          onClick={() => router.push("/browse")}
          className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold py-2.5 text-xs font-bold text-navy shadow-sm"
        >
          <Layers className="h-3.5 w-3.5" />
          Swipe
        </button>
      </div>

      {hasHistory && (
        <SearchCollapsible
          title={saved.length > 0 ? "Saved & recent" : "Recent searches"}
          icon={saved.length > 0 ? Bookmark : Clock}
        >
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {saved.map((s) => (
              <button
                key={s.href}
                type="button"
                onClick={() => router.push(s.href)}
                className="pressable shrink-0 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-navy"
              >
                {s.label}
              </button>
            ))}
            {recent.slice(0, 5).map((r) => (
              <button
                key={r.href}
                type="button"
                onClick={() => router.push(r.href)}
                className="pressable shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {r.label}
              </button>
            ))}
          </div>
        </SearchCollapsible>
      )}

      <SearchCollapsible title="Trending searches" icon={TrendingUp}>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          {TRENDING_PREVIEW.map((t) => (
            <button
              key={t.href}
              type="button"
              onClick={() => router.push(t.href)}
              className="pressable shrink-0 rounded-full border border-surface bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
      </SearchCollapsible>

      <SearchCollapsible title="Popular property types">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          {POPULAR_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                params.set("property_type", t.value);
                pushSearch(params, t.label);
              }}
              className="pressable shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
      </SearchCollapsible>

      <SearchCollapsible title="Nearby areas">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          {NEARBY_PREVIEW.map((a) => (
            <button
              key={a.href}
              type="button"
              onClick={() => router.push(a.href)}
              className="pressable shrink-0 rounded-full border border-dashed border-gold/25 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {a.area}
            </button>
          ))}
        </div>
      </SearchCollapsible>

      <SearchCollapsible title="Advanced filters">
        <SearchFiltersBar className="!px-0" />
      </SearchCollapsible>
    </div>
  );
}
