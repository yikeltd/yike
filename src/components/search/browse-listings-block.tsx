"use client";

import { useMemo, useState } from "react";
import {
  BUDGET_RANGES,
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateForCity,
  getStates,
} from "@/lib/constants";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  HOME_DEAL_TYPES,
  chipToFilterParams,
  type SearchDealChip,
} from "@/constants/listingTypes";
import { parseLocationQuery } from "@/lib/location-search";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-surface bg-white px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-gold/35 dark:bg-elevated lg:text-sm";

function resolveChip(key: string): SearchDealChip {
  return (
    HOME_DEAL_TYPES.find(
      (t) =>
        t.value === key ||
        (key === "land" && t.hub === "land_sale") ||
        (key === "shops" && t.propertyType === "shop") ||
        (key === "hotel" && t.propertyType === "hotel")
    ) ?? HOME_DEAL_TYPES[0]
  );
}

function chipKey(chip: SearchDealChip): string {
  if (chip.hub === "land_sale") return "land";
  if (chip.propertyType === "shop") return "shops";
  if (chip.propertyType === "hotel") return "hotel";
  return chip.value;
}

export type BrowseSearchPayload = {
  params: URLSearchParams;
  label: string;
};

export type BrowseListingsInitial = {
  dealKey?: string;
  state?: string;
  city?: string;
  area?: string;
  propertyType?: string;
  budgetIndex?: string;
  locationQuery?: string;
};

export function BrowseListingsBlock({
  onSearch,
  initial,
}: {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: BrowseListingsInitial;
}) {
  const [dealKey, setDealKey] = useState(initial?.dealKey ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [budget, setBudget] = useState(initial?.budgetIndex ?? "0");
  const [locationQuery, setLocationQuery] = useState(initial?.locationQuery ?? "");

  const cityOptions = useMemo(
    () => (state ? getAllCitiesForState(state) : getAllCitiesComplete()),
    [state]
  );

  function buildParams(overrides?: {
    dealKey?: string;
    state?: string;
    city?: string;
    area?: string;
    propertyType?: string;
    budgetIndex?: string;
  }): BrowseSearchPayload {
    const chip = resolveChip(overrides?.dealKey ?? dealKey);
    const filter = chipToFilterParams(chip);
    const searchState = overrides?.state ?? state;
    const searchCity = overrides?.city ?? city;
    const searchArea = (overrides?.area ?? area).trim();
    const searchPropertyType =
      overrides?.propertyType ?? (propertyType || filter.property_type);
    const budgetIndex = overrides?.budgetIndex ?? budget;

    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.hub) params.set("hub", filter.hub);
    if (searchPropertyType && !filter.hub) {
      params.set("property_type", searchPropertyType);
    }
    if (searchState) params.set("state", searchState);
    if (searchCity) params.set("city", searchCity);
    if (searchArea) params.set("area", searchArea);

    const range = BUDGET_RANGES[Number(budgetIndex)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    const label =
      [searchCity, searchArea].filter(Boolean).join(" · ") ||
      chip.label ||
      "All Nigeria";

    return { params, label };
  }

  function submit(overrides?: Parameters<typeof buildParams>[0]) {
    onSearch(buildParams(overrides));
  }

  function onLocationSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = locationQuery.trim();
    if (!trimmed) {
      submit();
      return;
    }
    const parsed = parseLocationQuery(trimmed);
    const nextCity = parsed.city ?? city;
    const nextArea = parsed.area ?? area;
    const nextState = parsed.state ?? state;
    if (parsed.city) setCity(parsed.city);
    if (parsed.area) setArea(parsed.area);
    if (parsed.state) setState(parsed.state);
    setLocationQuery([nextCity, nextArea].filter(Boolean).join(", "));
    submit({ city: nextCity, area: nextArea, state: nextState });
  }

  return (
    <div className="rounded-2xl border border-surface bg-white p-3.5 shadow-sm ring-1 ring-navy/[0.04] dark:bg-elevated dark:ring-white/[0.05]">
      <p className="mb-3 text-sm font-bold text-navy dark:text-foreground">
        Browse real listings
      </p>

      <div className="hide-scrollbar -mx-0.5 mb-3 flex gap-2 overflow-x-auto pb-0.5">
        {HOME_DEAL_TYPES.map((t) => {
          const key = chipKey(t);
          const active = dealKey === key;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                setDealKey(key);
                submit({ dealKey: key });
              }}
              className={cn(
                "pressable shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200",
                active
                  ? "bg-gold text-navy shadow-glow-gold"
                  : "bg-surface text-muted ring-1 ring-black/[0.04] hover:text-foreground dark:ring-white/[0.06]"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onLocationSubmit} className="mb-3">
        <div className="flex items-center gap-2 rounded-xl border border-surface bg-surface/60 px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          <input
            type="search"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="City, area or neighbourhood"
            aria-label="City, area or neighbourhood"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          />
          <button
            type="submit"
            className="pressable shrink-0 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-navy"
          >
            Go
          </button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={state}
          onChange={(e) => {
            const value = e.target.value;
            setState(value);
            setCity("");
            setArea("");
            submit({ state: value, city: "", area: "" });
          }}
          aria-label="State"
          className={selectClass}
        >
          <option value="">State</option>
          {getStates().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => {
            const value = e.target.value;
            setCity(value);
            setArea("");
            const inferred = value ? getStateForCity(value) : "";
            if (inferred) setState(inferred);
            submit({
              city: value,
              area: "",
              state: inferred || state,
            });
          }}
          aria-label="City"
          className={selectClass}
        >
          <option value="">City</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => {
            const value = e.target.value;
            setPropertyType(value);
            submit({ propertyType: value });
          }}
          aria-label="Property type"
          className={selectClass}
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.slice(0, 14).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={budget}
          onChange={(e) => {
            const value = e.target.value;
            setBudget(value);
            submit({ budgetIndex: value });
          }}
          aria-label="Budget"
          className={selectClass}
        >
          {BUDGET_RANGES.map((b, i) => (
            <option key={b.label} value={i}>
              {i === 0 ? "Any budget" : b.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
