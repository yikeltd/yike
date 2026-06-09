"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAreasForSearchCity } from "@/lib/constants";
import {
  budgetContextFromDealKey,
  budgetLabelFromValue,
  budgetParamsFromValue,
  budgetValueMatchesContext,
  buildBudgetSelectOptions,
} from "@/lib/budget-ranges";
import { getAllCitiesForState } from "@/constants/nigeriaAllCities";
import { NIGERIAN_STATES } from "@/lib/constants";
import { SEARCH_DEAL_TYPES, findDealChip } from "@/constants/listingTypes";
import {
  addRecentSearch,
  getRecentSearches,
  TRENDING_AREAS,
  type RecentSearch,
} from "@/lib/search-recent";
import { parseLocationQuery } from "@/lib/location-search";
import { LocationCombobox } from "./location-combobox";
import { ThemedSelect } from "@/components/ui/themed-select";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { TrendingUp, Clock, ChevronDown, SlidersHorizontal } from "lucide-react";

export function SearchExperience({
  initialType,
  initialCity,
  initialArea,
}: {
  initialType?: string;
  initialCity?: string;
  initialArea?: string;
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState(initialType ?? "");
  const [searchState, setSearchState] = useState("");
  const [city, setCity] = useState(initialCity ?? "");
  const [area, setArea] = useState(initialArea ?? "");
  const [budget, setBudget] = useState("");
  const [smartQuery, setSmartQuery] = useState("");
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(
    !initialCity && !initialArea
  );

  const cityOptions = searchState ? getAllCitiesForState(searchState) : [];
  const areas = city ? getAreasForSearchCity(city) : [];
  const budgetContext = budgetContextFromDealKey(
    listingType === "land" ? "land" : listingType || ""
  );
  const budgetOptions = buildBudgetSelectOptions(budgetContext);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    if (initialCity || initialArea) {
      setFiltersOpen(false);
    }
  }, [initialCity, initialArea]);

  function buildParams(override?: {
    city?: string;
    area?: string;
  }): URLSearchParams {
    const searchCity = override?.city ?? city;
    const searchArea = override?.area ?? area;
    const params = new URLSearchParams();
    const chip = findDealChip(
      listingType,
      listingType === "land" ? "land_sale" : null
    );
    if (chip?.hub) params.set("hub", chip.hub);
    else if (listingType) params.set("type", listingType);
    if (searchState) params.set("state", searchState);
    if (searchCity) params.set("city", searchCity);
    if (searchArea) params.set("area", searchArea);
    const { min: budgetMin, max: budgetMax } = budgetParamsFromValue(budget);
    if (budgetMin) params.set("min", budgetMin);
    if (budgetMax) params.set("max", budgetMax);
    return params;
  }

  function runSearch(override?: { city?: string; area?: string; label?: string }) {
    const params = buildParams(override);
    const href = `/search?${params.toString()}`;
    const label =
      override?.label ??
      ([city, area].filter(Boolean).join(" · ") || "All Nigeria");
    addRecentSearch({ label, href });
    setFiltersOpen(false);
    trackEvent("search", {
      city: (override?.city ?? city) || undefined,
      area: (override?.area ?? area) || undefined,
      listing_type: listingType || undefined,
      budget: budgetLabelFromValue(budget, budgetContext) ?? undefined,
    });
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
    const chip = findDealChip(
      listingType,
      listingType === "land" ? "land_sale" : null
    );
    if (chip?.hub) params.set("hub", chip.hub);
    else if (listingType) params.set("type", listingType);
    if (parsed.state) params.set("state", parsed.state);
    if (parsed.city) params.set("city", parsed.city);
    if (parsed.area) params.set("area", parsed.area);
    if (parsed.bedrooms) params.set("beds", String(parsed.bedrooms));
    if (!parsed.city && !parsed.area && !parsed.state) params.set("q", smartQuery);
    const { min: budgetMin, max: budgetMax } = budgetParamsFromValue(budget);
    if (budgetMin) params.set("min", budgetMin);
    if (budgetMax) params.set("max", budgetMax);
    const href = `/search?${params.toString()}`;
    addRecentSearch({
      label: parsed.resolvedLabel ?? smartQuery,
      href,
    });
    setFiltersOpen(false);
    router.push(href);
  }

  function selectTrending(t: RecentSearch) {
    addRecentSearch(t);
    setFiltersOpen(false);
    router.push(t.href);
  }

  const dealLabel =
    findDealChip(listingType, listingType === "land" ? "land_sale" : null)
      ?.label ?? "All";
  const locationLabel =
    [city, area].filter(Boolean).join(" · ") || "All Nigeria";

  return (
    <div className="space-y-4 px-3 pt-2">
      <LocationCombobox
        value={smartQuery}
        onChange={setSmartQuery}
        onSubmit={runSmartSearch}
        onSelect={(match) => {
          setCity(match.city);
          setArea(match.area);
          setFiltersOpen(false);
          runSearch({
            city: match.city,
            area: match.area,
            label: match.label,
          });
        }}
        placeholder='Try "Lekki", "New Haven Enugu", "2 bedroom in Yaba"'
      />

      {!filtersOpen ? (
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="pressable flex w-full items-center justify-between gap-2 rounded-xl border border-surface bg-elevated px-4 py-3 text-left shadow-float"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gold" />
            <span className="truncate text-muted">
              <span className="font-semibold text-foreground">{dealLabel}</span>
              {" · "}
              {locationLabel}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
      ) : (
        <div className="rounded-2xl bg-elevated p-4 shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {SEARCH_DEAL_TYPES.map((t) => {
              const chipValue = t.hub ? "land" : t.value;
              return (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  const nextContext = budgetContextFromDealKey(
                    chipValue === "land" ? "land" : chipValue || ""
                  );
                  setListingType(chipValue);
                  if (!budgetValueMatchesContext(budget, nextContext)) {
                    setBudget("");
                  }
                }}
                className={cn(
                  "pressable shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200",
                  listingType === chipValue
                    ? "bg-gold text-navy shadow-glow-gold"
                    : "bg-surface text-muted"
                )}
              >
                {t.label}
              </button>
            );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <select
              value={searchState}
              onChange={(e) => {
                setSearchState(e.target.value);
                setCity("");
                setArea("");
              }}
              className="h-12 w-full rounded-xl bg-surface px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">All states</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              list="search-city-options"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setArea("");
              }}
              placeholder="City, town, or LGA (type freely)"
              className="h-12 w-full rounded-xl bg-surface px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-gold/40"
            />
            {cityOptions.length > 0 ? (
              <datalist id="search-city-options">
                {cityOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            ) : null}

            <input
              list={areas.length > 0 ? "search-area-options" : undefined}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area or neighbourhood (optional)"
              className="h-12 w-full rounded-xl bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-gold/40"
            />
            {areas.length > 0 ? (
              <datalist id="search-area-options">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            ) : null}

            <ThemedSelect
              value={budget}
              onChange={setBudget}
              options={budgetOptions}
              placeholder="Any budget"
              ariaLabel="Budget"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFiltersOpen(false);
              runSearch();
            }}
            className="pressable mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-gold-dark"
          >
            Apply filters
          </button>
        </div>
      )}

      <section>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          Trending areas
        </p>
        <div className="flex flex-wrap gap-2">
          {TRENDING_AREAS.map((t) => (
            <button
              key={t.href}
              type="button"
              onClick={() => selectTrending(t)}
              className="pressable rounded-full bg-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-float ring-1 ring-black/[0.04] transition-colors hover:bg-gold/15 dark:ring-white/[0.06]"
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {filtersOpen && recent.length > 0 && (
        <section>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Clock className="h-3.5 w-3.5" />
            Recent
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <button
                key={r.href}
                type="button"
                onClick={() => selectTrending(r)}
                className="pressable block w-full rounded-xl bg-elevated px-4 py-3 text-left text-sm font-medium text-foreground shadow-float"
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
