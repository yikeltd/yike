"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUDGET_RANGES,
  getAreasForSearchCity,
  LISTING_TYPES,
  POPULAR_CITIES,
} from "@/lib/constants";
import {
  addRecentSearch,
  getRecentSearches,
  TRENDING_AREAS,
  type RecentSearch,
} from "@/lib/search-recent";
import { parseLocationQuery } from "@/lib/location-search";
import { LocationCombobox } from "./location-combobox";
import { cn } from "@/lib/utils";
import { Search, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export function SearchExperience({
  initialType,
  initialCity,
}: {
  initialType?: string;
  initialCity?: string;
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState(initialType ?? "rent");
  const [city, setCity] = useState(initialCity ?? "");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("0");
  const [smartQuery, setSmartQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  const areas = city ? getAreasForSearchCity(city) : [];

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  function runSearch(override?: { city?: string; area?: string; label?: string }) {
    const searchCity = override?.city ?? city;
    const searchArea = override?.area ?? area;
    const params = new URLSearchParams();
    params.set("type", listingType);
    if (searchCity) params.set("city", searchCity);
    if (searchArea) params.set("area", searchArea);
    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));
    const href = `/search?${params.toString()}`;
    const label =
      override?.label ??
      ([searchCity, searchArea].filter(Boolean).join(" · ") || "All Nigeria");
    addRecentSearch({ label, href });
    router.push(href);
  }

  function runSmartSearch() {
    if (!smartQuery.trim()) {
      runSearch();
      return;
    }
    const parsed = parseLocationQuery(smartQuery);
    if (parsed.city) setCity(parsed.city);
    if (parsed.area) setArea(parsed.area);
    const params = new URLSearchParams();
    params.set("type", listingType);
    if (parsed.state) params.set("state", parsed.state);
    if (parsed.city) params.set("city", parsed.city);
    if (parsed.area) params.set("area", parsed.area);
    if (parsed.bedrooms) params.set("beds", String(parsed.bedrooms));
    if (!parsed.city && !parsed.area && !parsed.state) params.set("q", smartQuery);
    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));
    const href = `/search?${params.toString()}`;
    addRecentSearch({
      label: parsed.resolvedLabel ?? smartQuery,
      href,
    });
    router.push(href);
  }

  return (
    <div className="space-y-6 px-3 pt-2">
      <LocationCombobox
        value={smartQuery}
        onChange={setSmartQuery}
        onSelect={(match) => {
          setCity(match.city);
          setArea(match.area);
          runSearch({
            city: match.city,
            area: match.area,
            label: match.label,
          });
        }}
        placeholder='Try "Lekki", "New Haven Enugu", "2 bedroom in Yaba"'
      />

      <div
        className={cn(
          "rounded-2xl bg-elevated p-4 shadow-float transition-all duration-300",
          focused && "shadow-float-lg ring-2 ring-gold/30"
        )}
      >
        <div className="flex gap-2">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setListingType(t.value)}
              className={cn(
                "pressable flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-200",
                listingType === t.value
                  ? "bg-gold text-navy shadow-glow-gold"
                  : "bg-surface text-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <select
            value={city}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              setCity(e.target.value);
              setArea("");
            }}
            className="h-12 w-full rounded-xl bg-surface px-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-2 focus:ring-gold/40"
          >
            <option value="">All cities</option>
            {POPULAR_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {areas.length > 0 ? (
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-12 w-full rounded-xl bg-surface px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area or neighbourhood"
              className="h-12 w-full rounded-xl bg-surface px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
            />
          )}

          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-12 w-full rounded-xl bg-surface px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
          >
            {BUDGET_RANGES.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => runSmartSearch()}
          className="pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold"
        >
          <Search className="h-4 w-4" />
          Search homes
        </button>
      </div>

      <section>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          Trending areas
        </p>
        <div className="flex flex-wrap gap-2">
          {TRENDING_AREAS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => addRecentSearch(t)}
              className="pressable rounded-full bg-elevated px-4 py-2 text-sm font-semibold text-navy shadow-float transition-colors hover:bg-gold/15"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Clock className="h-3.5 w-3.5" />
            Recent
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="pressable block rounded-xl bg-elevated px-4 py-3 text-sm font-medium text-foreground shadow-float"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
