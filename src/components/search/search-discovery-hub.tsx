"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUDGET_RANGES,
  getAreasForSearchCity,
  POPULAR_CITIES,
} from "@/lib/constants";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { getRecentSearches, TRENDING_AREAS } from "@/lib/search-recent";
import { getSavedSearches } from "@/lib/saved-searches";
import { getBrowsePreferences, saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { LocationCombobox } from "./location-combobox";
import { SaveSearchButton } from "./save-search-button";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  Clock,
  Map,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const POPULAR_TYPES = PROPERTY_CATEGORIES.filter((c) =>
  ["self_contain", "mini_flat", "flat", "flat_2", "shop", "shortlet_apt", "land"].includes(
    c.value
  )
);

export function SearchDiscoveryHub({
  hasResults,
  currentHref,
  currentLabel,
}: {
  hasResults: boolean;
  currentHref?: string;
  currentLabel?: string;
}) {
  const router = useRouter();
  const [smartQuery, setSmartQuery] = useState("");
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [listingType, setListingType] = useState("");
  const [city, setCity] = useState("");
  const [recent, setRecent] = useState(getRecentSearches());
  const [saved, setSaved] = useState(getSavedSearches());

  useEffect(() => {
    const prefs = getBrowsePreferences();
    if (prefs.cities[0]) setCity(prefs.cities[0]);
  }, []);

  const nearbyAreas = useMemo(() => {
    const target = city || getBrowsePreferences().cities[0];
    if (!target) return POPULAR_AREAS.slice(0, 6);
    return POPULAR_AREAS.filter((a) => a.city === target).slice(0, 6);
  }, [city]);

  const areas = city ? getAreasForSearchCity(city) : [];

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

  function applyBudget() {
    const params = new URLSearchParams();
    if (listingType) params.set("type", listingType);
    if (city) params.set("city", city);
    const range = BUDGET_RANGES[budgetIdx];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));
    pushSearch(params, `${city || "Nigeria"} · ${range?.label ?? "Budget"}`);
  }

  return (
    <div className="space-y-6 px-3 pb-2 pt-3 lg:px-0">
      <div className="rounded-2xl bg-navy p-5 text-white lg:hidden">
        <p className="text-xs font-bold uppercase tracking-wider text-gold">Search hub</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">Find your next home</h1>
        <p className="mt-1 text-sm text-white/75">
          Filters, saved searches, and smart suggestions — built for serious house hunting.
        </p>
      </div>

      <LocationCombobox
        value={smartQuery}
        onChange={setSmartQuery}
        onSubmit={() => {
          if (!smartQuery.trim()) return;
          router.push(`/search?q=${encodeURIComponent(smartQuery)}`);
        }}
        onSelect={(match) => {
          const params = new URLSearchParams();
          params.set("city", match.city);
          params.set("area", match.area);
          pushSearch(params, match.label);
        }}
        placeholder='Try "shortlet Lekki", "self contain Ogbor Hill", "shop Ariaria"'
      />

      {currentHref && hasResults && (
        <div className="flex items-center justify-between rounded-xl bg-gold/10 px-4 py-3">
          <p className="text-sm font-semibold text-navy">
            Viewing: <span className="capitalize">{currentLabel}</span>
          </p>
          <SaveSearchButton label={currentLabel ?? "Search"} href={currentHref} />
        </div>
      )}

      {saved.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Bookmark className="h-3.5 w-3.5 text-gold" />
            Saved searches
          </p>
          <div className="flex flex-wrap gap-2">
            {saved.map((s) => (
              <button
                key={s.href}
                type="button"
                onClick={() => router.push(s.href)}
                className="pressable rounded-full bg-elevated px-3 py-2 text-sm font-semibold text-foreground shadow-float"
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Clock className="h-3.5 w-3.5" />
            Recent
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <button
                key={r.href}
                type="button"
                onClick={() => router.push(r.href)}
                className="pressable block w-full rounded-xl bg-elevated px-4 py-3 text-left text-sm font-medium shadow-float"
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          Trending searches
        </p>
        <div className="flex flex-wrap gap-2">
          {TRENDING_AREAS.map((t) => (
            <button
              key={t.href}
              type="button"
              onClick={() => router.push(t.href)}
              className="pressable rounded-full bg-elevated px-3 py-2 text-sm font-semibold shadow-float"
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-elevated p-4 shadow-float ring-1 ring-black/[0.04]">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
          Advanced filters
        </p>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {SEARCH_DEAL_TYPES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setListingType(t.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm font-bold",
                listingType === t.value ? "bg-gold text-navy" : "bg-surface text-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-3 h-11 w-full rounded-xl bg-surface px-3 text-sm"
        >
          <option value="">All cities</option>
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {areas.length > 0 && (
          <select
            className="mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm"
            onChange={(e) => {
              if (!e.target.value) return;
              const params = new URLSearchParams();
              if (listingType) params.set("type", listingType);
              params.set("city", city);
              params.set("area", e.target.value);
              pushSearch(params, `${city} · ${e.target.value}`);
            }}
            defaultValue=""
          >
            <option value="">Nearby area…</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
        <label className="mt-4 block text-xs font-bold text-muted">
          Budget: {BUDGET_RANGES[budgetIdx]?.label}
        </label>
        <input
          type="range"
          min={0}
          max={BUDGET_RANGES.length - 1}
          value={budgetIdx}
          onChange={(e) => setBudgetIdx(Number(e.target.value))}
          className="mt-2 w-full accent-gold"
        />
        <button
          type="button"
          onClick={applyBudget}
          className="pressable mt-3 w-full rounded-xl bg-navy py-3 text-sm font-bold text-white"
        >
          Apply filters
        </button>
      </section>

      <section>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Popular property types
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                params.set("property_type", t.value);
                if (city) params.set("city", city);
                pushSearch(params, t.label);
              }}
              className="pressable rounded-full bg-surface px-3 py-2 text-sm font-semibold text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {nearbyAreas.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            Nearby areas
          </p>
          <div className="flex flex-wrap gap-2">
            {nearbyAreas.map((a) => (
              <button
                key={a.href}
                type="button"
                onClick={() => router.push(a.href)}
                className="pressable rounded-full border border-surface bg-elevated px-3 py-2 text-sm font-medium"
              >
                {a.area}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-surface bg-surface/50 p-6 text-center">
        <Map className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-2 text-sm font-bold text-navy">Map view coming soon</p>
        <p className="mt-1 text-xs text-muted">Explore listings on a map — Lagos & tier-2 cities first.</p>
      </section>
    </div>
  );
}
